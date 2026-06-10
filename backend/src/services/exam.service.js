const {
    PracticeExam,
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

const PASS_THRESHOLD = 70;
const DEFAULT_QUESTION_COUNT = 20;

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

    async startPractice(userId, data) {
        const enrollment = data.enrollmentId
            ? await Enrollment.findOne({ _id: data.enrollmentId, userId })
            : await getActiveEnrollment(userId);

        const categoryCode = data.categoryCode || enrollment?.categoryCode;
        if (!categoryCode) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);

        const subTypeCode = data.subTypeCode || enrollment?.subTypeCode;
        const schoolId = data.schoolId || enrollment?.schoolId;

        const pool = await this._collectQuestions(categoryCode, subTypeCode, schoolId);
        if (!pool.length) throw new ApiError(404, ERR.NO_QUESTIONS_AVAILABLE);

        const count = Math.min(data.questionCount || DEFAULT_QUESTION_COUNT, pool.length);
        const questions = shuffle(pool).slice(0, count);
        const previousAttempts = await PracticeExam.countDocuments({ userId, categoryCode: categoryCode.toUpperCase() });

        return {
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            enrollmentId: enrollment?._id || null,
            schoolId: schoolId || null,
            attempt: previousAttempts + 1,
            questionCount: count,
            durationSeconds: data.durationSeconds || 1800,
            questions,
        };
    }

    async submitPractice(userId, data) {
        const enrollment = await getActiveEnrollment(userId);
        const categoryCode = enrollment?.categoryCode || data.categoryCode || 'B';
        const subTypeCode = enrollment?.subTypeCode || data.subTypeCode || null;
        const schoolId = enrollment?.schoolId || data.schoolId || null;

        const answerKey = await buildAnswerKey(categoryCode, subTypeCode, schoolId);
        const answers = data.answers || [];
        let correctCount = 0;
        const review = answers.map((answer) => {
            const key = answerKey.get(String(answer.questionId));
            const isCorrect = Boolean(key && answer.selectedAnswer === key.correctAnswer);
            if (isCorrect) correctCount += 1;
            return {
                questionId: answer.questionId,
                text: key?.text || null,
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: key?.correctAnswer || null,
                explanation: key?.explanation || '',
                isCorrect,
            };
        });

        const total = answers.length || 1;
        const score = Math.round((correctCount / total) * 100);
        const passed = score >= PASS_THRESHOLD;

        const exam = await PracticeExam.create({
            userId,
            enrollmentId: enrollment?._id || null,
            schoolId: schoolId || null,
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            score,
            passed,
            attempt: data.attempt || 1,
            durationSeconds: data.durationSeconds || 0,
            answers,
            questionIds: answers.map((a) => a.questionId),
        });

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
                        progressPercent: Math.min(100, Math.round((exam.score / 100) * 60)),
                    },
                },
                { upsert: true, new: true },
            );
        }

        return { exam, review, score, passed };
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

        return {
            enrollment: enrollment
                ? { id: enrollment._id, status: enrollment.status, categoryCode: enrollment.categoryCode }
                : null,
            schedules,
            finalResult,
            passThreshold: PASS_THRESHOLD,
        };
    }

    async getFinalResult(enrollmentId) {
        return FinalExamResult.findOne({ enrollmentId }).sort({ createdAt: -1 }).lean();
    }

    async recordFinalResult(data, enteredBy = null) {
        const enrollment = await Enrollment.findById(data.enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const theoryPassed = data.theoryScore != null ? data.theoryScore >= PASS_THRESHOLD : null;
        const practicalPassed = data.practicalScore != null ? data.practicalScore >= PASS_THRESHOLD : null;

        const result = await FinalExamResult.create({
            enrollmentId: enrollment._id,
            userId: enrollment.userId,
            schoolId: enrollment.schoolId,
            theoryScore: data.theoryScore ?? null,
            practicalScore: data.practicalScore ?? null,
            theoryPassed,
            practicalPassed,
            finalStatus: data.finalStatus,
            retakeScope: data.retakeScope || null,
            attemptNumber: data.attemptNumber || 1,
            enteredBy,
            theoryAt: data.theoryScore != null ? new Date() : null,
            practicalAt: data.practicalScore != null ? new Date() : null,
        });

        const statusMap = {
            theory_passed: ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
            final_passed: ENROLLMENT_STATUS.FINAL_PASSED,
            final_failed_theory: ENROLLMENT_STATUS.FINAL_FAILED_THEORY,
            final_failed_practical: ENROLLMENT_STATUS.FINAL_FAILED_THEORY,
        };
        if (statusMap[data.finalStatus]) {
            enrollment.status = statusMap[data.finalStatus];
            enrollment.retakeScope = data.retakeScope || null;
            if (data.finalStatus === 'final_passed') {
                enrollment.status = ENROLLMENT_STATUS.COMPLETED;
            }
            await enrollment.save();
        }

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: enrollment.userId,
            type: NOTIFICATION_TYPES.EXAM_RESULT,
            title: 'نتيجة الامتحان النهائي',
            message: `تم تسجيل نتيجتك: ${data.finalStatus}`,
            data: { enrollmentId: enrollment._id, resultId: result._id },
        });

        return result;
    }

    async listCertificates(userId) {
        return DrivingLicenseRecord.find({ userId }).sort({ issueDate: -1 }).lean();
    }
}

module.exports = new ExamService();
