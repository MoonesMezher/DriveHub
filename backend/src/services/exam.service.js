const {
    PracticeExam,
    PracticeExamSession,
    QuestionBank,
    TheoryContent,
    FinalExamResult,
    TrafficExamSchedule,
    DrivingLicenseRecord,
    Enrollment,
} = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { getActiveEnrollment } = require('../helpers/enrollment.helper');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { PRACTICE_PASS_THRESHOLD } = require('../constants/examThresholds');
const { sendInstant } = require('../helpers/notificationDelivery.helper');

const DEFAULT_QUESTION_COUNT = 20;
const SUBMIT_GRACE_SECONDS = 5;

const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const stripQuestion = (q, sourceId) => ({
    _id: q._id,
    text: q.text,
    type: q.type,
    options: q.options,
    imageUrl: q.imageUrl,
    difficulty: q.difficulty,
    sourceId,
});

const normalizeIdSet = (ids = []) => ids.map((id) => String(id)).sort();
const sameQuestionSet = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    const aa = normalizeIdSet(a);
    const bb = normalizeIdSet(b);
    return aa.every((id, idx) => id === bb[idx]);
};

const buildAnswerKey = async (categoryCode, subTypeCode = null, schoolId = null) => {
    const code = categoryCode.toUpperCase();
    const sub = subTypeCode?.toUpperCase() || null;
    const keyMap = new Map();

    const bankFilter = { categoryCode: code, status: 'active' };
    if (sub) bankFilter.subTypeCode = sub;
    if (schoolId) bankFilter.schoolId = schoolId;

    const banks = await QuestionBank.find(bankFilter).lean();
    for (const bank of banks) {
        for (const q of bank.questions || []) {
            if (q.status !== 'archived' && q._id) {
                keyMap.set(String(q._id), {
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    text: q.text,
                });
            }
        }
    }

    const theoryFilter = { categoryCode: code, isActive: true };
    if (sub) theoryFilter.subTypeCode = sub;
    const theory = await TheoryContent.find(theoryFilter).lean();
    for (const content of theory) {
        for (const q of content.interactiveQuestions || []) {
            if (q.status !== 'archived' && q._id) {
                keyMap.set(String(q._id), {
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    text: q.text,
                });
            }
        }
    }

    return keyMap;
};

class ExamService {
    _pickQuestions(pool, count, previousQuestionIds = []) {
        if (pool.length <= count) return shuffle(pool).slice(0, count);

        let picked = shuffle(pool).slice(0, count);
        if (!previousQuestionIds.length) return picked;

        for (let attempt = 0; attempt < 6; attempt += 1) {
            if (!sameQuestionSet(picked.map((q) => q._id), previousQuestionIds)) {
                return picked;
            }
            picked = shuffle(pool).slice(0, count);
        }
        return picked;
    }

    async _finalizeSession(userId, session, rawAnswers = []) {
        const answerKey = await buildAnswerKey(session.categoryCode, session.subTypeCode, session.schoolId);
        const allowedIds = new Set((session.questionIds || []).map(String));
        const answerMap = new Map(
            (rawAnswers || [])
                .filter((a) => allowedIds.has(String(a.questionId)))
                .map((a) => [String(a.questionId), a.selectedAnswer]),
        );

        let correctCount = 0;
        const review = (session.questionIds || []).map((qId) => {
            const key = answerKey.get(String(qId));
            const selectedAnswer = answerMap.get(String(qId)) ?? null;
            const isCorrect = Boolean(key && selectedAnswer != null && selectedAnswer === key.correctAnswer);
            if (isCorrect) correctCount += 1;
            return {
                questionId: qId,
                text: key?.text || null,
                selectedAnswer,
                correctAnswer: key?.correctAnswer || null,
                explanation: key?.explanation || '',
                isCorrect,
                unanswered: selectedAnswer == null,
            };
        });

        const total = session.questionIds.length || 1;
        const score = Math.round((correctCount / total) * 100);
        const passed = score >= PRACTICE_PASS_THRESHOLD;
        const elapsedSeconds = Math.min(
            session.durationSeconds,
            Math.max(0, Math.round((Date.now() - session.startedAt.getTime()) / 1000)),
        );

        const enrollment = session.enrollmentId
            ? await Enrollment.findById(session.enrollmentId)
            : await getActiveEnrollment(userId);

        const exam = await PracticeExam.create({
            userId,
            enrollmentId: enrollment?._id || session.enrollmentId || null,
            schoolId: session.schoolId || null,
            categoryCode: session.categoryCode,
            subTypeCode: session.subTypeCode,
            score,
            passed,
            attempt: session.attempt,
            durationSeconds: elapsedSeconds,
            answers: (rawAnswers || []).filter((a) => allowedIds.has(String(a.questionId))),
            questionIds: session.questionIds,
        });

        session.status = 'submitted';
        session.submittedAt = new Date();
        session.practiceExamId = exam._id;
        await session.save();

        if (enrollment) {
            const { StudentStatistics } = require('../models');
            await StudentStatistics.findOneAndUpdate(
                { enrollmentId: enrollment._id },
                {
                    $push: {
                        practiceScores: {
                            examId: exam._id,
                            score: exam.score,
                            passed: exam.passed,
                            takenAt: new Date(),
                        },
                    },
                    $set: {
                        userId,
                        progressPercent: Math.min(100, Math.round((exam.score / 100) * 60)),
                    },
                },
                { upsert: true, new: true },
            );
        }

        return { exam, review, score, passed };
    }

    async _collectQuestions(categoryCode, subTypeCode = null, schoolId = null) {
        const code = categoryCode.toUpperCase();
        const sub = subTypeCode?.toUpperCase() || null;
        const pool = [];

        const bankFilter = { categoryCode: code, status: 'active' };
        if (sub) bankFilter.subTypeCode = sub;
        if (schoolId) bankFilter.schoolId = schoolId;

        const banks = await QuestionBank.find(bankFilter).lean();
        for (const bank of banks) {
            for (const q of bank.questions || []) {
                if (q.status !== 'archived') {
                    pool.push(stripQuestion(q, bank._id));
                }
            }
        }

        const theoryFilter = { categoryCode: code, isActive: true };
        if (sub) theoryFilter.subTypeCode = sub;
        const theory = await TheoryContent.find(theoryFilter).lean();
        for (const content of theory) {
            for (const q of content.interactiveQuestions || []) {
                if (q.status !== 'archived') {
                    pool.push(stripQuestion(q, content._id));
                }
            }
        }

        return pool;
    }

    async _assertCanTakePractice(userId, categoryCode) {
        const lastPassed = await PracticeExam.findOne({
            userId,
            categoryCode: categoryCode.toUpperCase(),
            passed: true,
        })
            .sort({ completedAt: -1 })
            .lean();
        if (lastPassed) throw new ApiError(403, ERR.PRACTICE_ALREADY_PASSED);
    }

    async startPractice(userId, data) {
        const enrollment = data.enrollmentId
            ? await Enrollment.findOne({ _id: data.enrollmentId, userId })
            : await getActiveEnrollment(userId);

        const categoryCode = data.categoryCode || enrollment?.categoryCode;
        if (!categoryCode) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);

        await this._assertCanTakePractice(userId, categoryCode);

        const subTypeCode = data.subTypeCode || enrollment?.subTypeCode;
        const schoolId = data.schoolId || enrollment?.schoolId;

        const pool = await this._collectQuestions(categoryCode, subTypeCode, schoolId);
        if (!pool.length) throw new ApiError(404, ERR.NO_QUESTIONS_AVAILABLE);

        const count = Math.min(data.questionCount || DEFAULT_QUESTION_COUNT, pool.length);
        const lastAttempt = await PracticeExam.findOne({
            userId,
            categoryCode: categoryCode.toUpperCase(),
        })
            .sort({ completedAt: -1 })
            .select('questionIds')
            .lean();
        const questions = this._pickQuestions(pool, count, lastAttempt?.questionIds || []);
        const previousAttempts = await PracticeExam.countDocuments({ userId, categoryCode: categoryCode.toUpperCase() });
        const durationSeconds = data.durationSeconds || 1800;
        const startedAt = new Date();
        const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

        const activeSessions = await PracticeExamSession.find({ userId, status: 'active' });
        for (const activeSession of activeSessions) {
            const overdue = activeSession.expiresAt.getTime() + SUBMIT_GRACE_SECONDS * 1000 < Date.now();
            if (overdue) {
                activeSession.status = 'expired';
                await activeSession.save();
                continue;
            }
            // Enter/exit without explicit submit must still be accounted as a final attempt.
            await this._finalizeSession(userId, activeSession, []);
        }

        const session = await PracticeExamSession.create({
            userId,
            enrollmentId: enrollment?._id || null,
            schoolId: schoolId || null,
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            attempt: previousAttempts + 1,
            durationSeconds,
            questionIds: questions.map((q) => q._id),
            questions,
            startedAt,
            expiresAt,
        });

        return {
            sessionId: session._id,
            categoryCode: session.categoryCode,
            subTypeCode: session.subTypeCode,
            enrollmentId: enrollment?._id || null,
            schoolId: schoolId || null,
            attempt: session.attempt,
            questionCount: count,
            durationSeconds,
            expiresAt,
            passThreshold: PRACTICE_PASS_THRESHOLD,
            questions,
        };
    }

    async submitPractice(userId, data) {
        if (!data.sessionId) throw new ApiError(400, ERR.PRACTICE_SESSION_REQUIRED);

        const session = await PracticeExamSession.findOne({
            _id: data.sessionId,
            userId,
        });
        if (!session) throw new ApiError(404, ERR.PRACTICE_SESSION_NOT_FOUND);
        if (session.status === 'submitted') throw new ApiError(400, ERR.PRACTICE_SESSION_NOT_FOUND);

        const now = Date.now();
        const expiresMs = session.expiresAt.getTime() + SUBMIT_GRACE_SECONDS * 1000;
        if (now > expiresMs) {
            session.status = 'expired';
            await session.save();
            throw new ApiError(400, ERR.PRACTICE_SESSION_EXPIRED);
        }

        const finalized = await this._finalizeSession(userId, session, data.answers || []);
        return { ...finalized, passThreshold: PRACTICE_PASS_THRESHOLD };
    }

    async getPracticeStatus(userId) {
        const enrollment = await getActiveEnrollment(userId);
        const categoryCode = enrollment?.categoryCode;
        let lastPassed = null;
        if (categoryCode) {
            lastPassed = await PracticeExam.findOne({
                userId,
                categoryCode: categoryCode.toUpperCase(),
                passed: true,
            })
                .sort({ completedAt: -1 })
                .lean();
        }
        return {
            passThreshold: PRACTICE_PASS_THRESHOLD,
            alreadyPassed: Boolean(lastPassed),
            lastPassedAt: lastPassed?.completedAt || null,
        };
    }

    async listPracticeHistory(userId, query = {}) {
        const filter = { userId };
        if (query.categoryCode) filter.categoryCode = query.categoryCode.toUpperCase();
        return PracticeExam.find(filter).sort({ completedAt: -1 }).limit(50).lean();
    }

    async getPracticeById(id, userId) {
        const exam = await PracticeExam.findOne({ _id: id, userId }).lean();
        if (!exam) throw new ApiError(404, ERR.NOT_FOUND);
        return exam;
    }

    async getExamInfo(userId) {
        const enrollment = await getActiveEnrollment(userId);
        const pendingRetake = await Enrollment.findOne({
            userId,
            archiveRef: null,
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            retakeAttempt: { $gte: 1 },
        }).sort({ createdAt: -1 }).lean();

        const activeEnrollment = enrollment || pendingRetake;
        const [schedules, finalResult] = await Promise.all([
            TrafficExamSchedule.find({
                studentId: userId,
                visibleToStudent: true,
                status: { $in: ['scheduled', 'completed'] },
            })
                .sort({ examDate: 1 })
                .lean(),
            enrollment
                ? FinalExamResult.findOne({ enrollmentId: enrollment._id }).sort({ createdAt: -1 }).lean()
                : null,
        ]);

        const retakeEligible = enrollment
            && !enrollment.archiveRef
            && ['final_failed_theory', 'final_theory_passed'].includes(enrollment.status);
        let retakeScope = null;
        if (retakeEligible) {
            const enrollmentService = require('./enrollment.service');
            try {
                retakeScope = await enrollmentService.deriveRetakeScope(enrollment, finalResult);
            } catch {
                retakeScope = enrollment.retakeScope || null;
            }
        }

        const tomorrowStart = new Date();
        tomorrowStart.setHours(0, 0, 0, 0);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        const examTomorrow = schedules.find(
            (s) => s.status === 'scheduled'
                && new Date(s.examDate) >= tomorrowStart
                && new Date(s.examDate) < tomorrowEnd,
        );

        return {
            enrollment: activeEnrollment
                ? {
                    id: activeEnrollment._id,
                    status: activeEnrollment.status,
                    categoryCode: activeEnrollment.categoryCode,
                    retakeAttempt: activeEnrollment.retakeAttempt,
                    retakeScope: activeEnrollment.retakeScope,
                }
                : null,
            schedules,
            finalResult,
            passThreshold: PRACTICE_PASS_THRESHOLD,
            retakeEligible,
            retakeScope,
            pendingRetakePayment: Boolean(pendingRetake),
            examTomorrow: examTomorrow || null,
        };
    }

    async getFinalResult(enrollmentId) {
        return FinalExamResult.findOne({ enrollmentId }).sort({ createdAt: -1 }).lean();
    }

    async recordFinalResult(data, enteredBy = null) {
        const enrollment = await Enrollment.findById(data.enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const theoryPassed = data.theoryScore != null ? data.theoryScore >= PRACTICE_PASS_THRESHOLD : null;
        const practicalPassed = data.practicalScore != null ? data.practicalScore >= PRACTICE_PASS_THRESHOLD : null;

        const enrollmentService = require('./enrollment.service');
        const retakeScope = data.retakeScope
            || (['final_failed_theory', 'final_failed_practical'].includes(data.finalStatus)
                ? await enrollmentService.deriveRetakeScope(enrollment, {
                    enrollmentId: enrollment._id,
                    theoryPassed,
                    practicalPassed,
                })
                : null);

        const result = await FinalExamResult.create({
            enrollmentId: enrollment._id,
            userId: enrollment.userId,
            schoolId: enrollment.schoolId,
            theoryScore: data.theoryScore ?? null,
            practicalScore: data.practicalScore ?? null,
            theoryPassed,
            practicalPassed,
            finalStatus: data.finalStatus,
            retakeScope,
            attemptNumber: data.attemptNumber || 1,
            enteredBy,
            theoryAt: data.theoryScore != null ? new Date() : null,
            practicalAt: data.practicalScore != null ? new Date() : null,
        });

        const statusMap = {
            theory_passed: ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
            final_passed: ENROLLMENT_STATUS.FINAL_PASSED,
            final_failed_theory: ENROLLMENT_STATUS.FINAL_FAILED_THEORY,
            final_failed_practical: ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
        };
        if (statusMap[data.finalStatus]) {
            enrollment.status = statusMap[data.finalStatus];
            enrollment.retakeScope = retakeScope;
            if (data.finalStatus === 'final_passed') {
                enrollment.status = ENROLLMENT_STATUS.COMPLETED;
            }
            await enrollment.save();
        }

        await sendInstant(enrollment.userId, {
            type: NOTIFICATION_TYPES.EXAM_RESULT,
            title: 'نتيجة الامتحان النهائي',
            message: `تم تسجيل نتيجتك: ${data.finalStatus}`,
            data: { enrollmentId: enrollment._id, resultId: result._id },
        });

        return result;
    }

    async listCertificates(userId) {
        const verificationService = require('./verification.service');
        const records = await DrivingLicenseRecord.find({ userId }).sort({ issueDate: -1 }).lean();
        const withVerification = await Promise.all(
            records.map(async (record) => {
                const verification = await verificationService.ensureCertificateToken(record._id);
                return {
                    ...record,
                    verificationToken: verification?.verificationToken || record.verificationToken,
                    verifyPath: verification?.verifyPath || null,
                };
            }),
        );
        return withVerification;
    }
}

module.exports = new ExamService();
