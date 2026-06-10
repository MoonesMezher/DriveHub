const {
    TheoryContent,
    TrainingContentShared,
    TrainingContentSpecific,
    PracticalVideo,
    ContentUnlockMode,
    QuestionBank,
    QuestionEditRequest,
    TrainingDataEdit,
    Instructor,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { getActiveEnrollment } = require('../helpers/enrollment.helper');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

const CONTENT_MODELS = {
    theory: TheoryContent,
    shared: TrainingContentShared,
    specific: TrainingContentSpecific,
    video: PracticalVideo,
};

const stripAnswers = (questions = []) =>
    questions.map((q) => {
        const obj = q.toObject ? q.toObject() : { ...q };
        delete obj.correctAnswer;
        return obj;
    });

class ContentService {
    _buildFilter(query = {}) {
        const filter = { isActive: true };
        if (query.categoryCode) filter.categoryCode = query.categoryCode.toUpperCase();
        if (query.subTypeCode) filter.subTypeCode = query.subTypeCode.toUpperCase();
        if (query.phase) filter.phase = Number(query.phase);
        if (query.section) filter.section = query.section;
        return filter;
    }

    async listTheory(query = {}) {
        return TheoryContent.find(this._buildFilter(query))
            .sort({ phase: 1, order: 1 })
            .select('-interactiveQuestions.correctAnswer')
            .lean();
    }

    async getTheoryById(id) {
        const content = await TheoryContent.findOne({ _id: id, isActive: true }).lean();
        if (!content) throw new ApiError(404, ERR.CONTENT_NOT_FOUND);
        if (content.interactiveQuestions?.length) {
            content.interactiveQuestions = stripAnswers(content.interactiveQuestions);
        }
        return content;
    }

    async listShared(query = {}) {
        return TrainingContentShared.find(this._buildFilter(query))
            .sort({ section: 1, order: 1 })
            .lean();
    }

    async listSpecific(query = {}) {
        return TrainingContentSpecific.find(this._buildFilter(query))
            .sort({ section: 1, order: 1 })
            .lean();
    }

    async listVideos(query = {}) {
        return PracticalVideo.find(this._buildFilter(query))
            .sort({ phase: 1, order: 1 })
            .lean();
    }

    async getUnlockMode(userId, query = {}) {
        const categoryCode = (query.categoryCode || '').toUpperCase();
        if (!categoryCode) {
            const enrollment = await getActiveEnrollment(userId);
            if (!enrollment) return { mode: 'progressive', categoryCode: null };
            return ContentUnlockMode.findOne({ userId, categoryCode: enrollment.categoryCode }).lean()
                || { mode: 'progressive', categoryCode: enrollment.categoryCode };
        }
        return ContentUnlockMode.findOne({ userId, categoryCode }).lean()
            || { mode: 'progressive', categoryCode };
    }

    async setUnlockMode(userId, { categoryCode, mode, enrollmentId = null }) {
        const code = categoryCode.toUpperCase();
        return ContentUnlockMode.findOneAndUpdate(
            { userId, categoryCode: code },
            { userId, categoryCode: code, mode, enrollmentId, unlockedAt: new Date() },
            { upsert: true, new: true, runValidators: true },
        );
    }

    async createTheory(data, adminId) {
        return TheoryContent.create({ ...data, categoryCode: data.categoryCode.toUpperCase(), updatedBy: adminId });
    }

    async createShared(data, adminId) {
        return TrainingContentShared.create({ ...data, updatedBy: adminId });
    }

    async createSpecific(data, adminId) {
        return TrainingContentSpecific.create({
            ...data,
            categoryCode: data.categoryCode.toUpperCase(),
            updatedBy: adminId,
        });
    }

    async createVideo(data) {
        return PracticalVideo.create({ ...data, categoryCode: data.categoryCode.toUpperCase() });
    }

    async listQuestionBanks(schoolId, query = {}) {
        const filter = { schoolId, status: { $ne: 'archived' } };
        if (query.categoryCode) filter.categoryCode = query.categoryCode.toUpperCase();
        return QuestionBank.find(filter).sort({ createdAt: -1 }).lean();
    }

    async createQuestionBank(userId, data) {
        const bank = await QuestionBank.create({
            ...data,
            categoryCode: data.categoryCode.toUpperCase(),
            addedBy: userId,
            status: 'active',
        });
        return bank;
    }

    async addQuestion(bankId, questionData) {
        const bank = await QuestionBank.findById(bankId);
        if (!bank) throw new ApiError(404, ERR.QUESTION_BANK_NOT_FOUND);
        bank.questions.push(questionData);
        await bank.save();
        return bank.questions[bank.questions.length - 1];
    }

    async _getCoachSchoolId(coachId) {
        const instructor = await Instructor.findOne({ userId: coachId, status: 'active' });
        if (!instructor) throw new ApiError(403, ERR.COACH_NOT_IN_SCHOOL);
        return instructor.schoolId;
    }

    async requestQuestionEdit(coachId, data) {
        const schoolId = await this._getCoachSchoolId(coachId);
        const bank = await QuestionBank.findOne({ _id: data.questionBankId, schoolId });
        if (!bank) throw new ApiError(404, ERR.QUESTION_BANK_NOT_FOUND);

        const question = bank.questions.id(data.questionId);
        if (!question) throw new ApiError(404, ERR.QUESTION_NOT_FOUND);

        return QuestionEditRequest.create({
            schoolId,
            coachId,
            questionBankId: data.questionBankId,
            questionId: data.questionId,
            proposedChanges: data.proposedChanges,
        });
    }

    async requestContentEdit(coachId, data) {
        const schoolId = await this._getCoachSchoolId(coachId);
        const Model = CONTENT_MODELS[data.contentType];
        if (!Model) throw new ApiError(400, ERR.VALIDATION_FAILED);

        const content = await Model.findById(data.contentId);
        if (!content) throw new ApiError(404, ERR.CONTENT_NOT_FOUND);

        return TrainingDataEdit.create({
            schoolId,
            coachId,
            contentType: data.contentType,
            contentId: data.contentId,
            proposedChanges: data.proposedChanges,
        });
    }

    async listPendingEdits(schoolId) {
        const [questionEdits, contentEdits] = await Promise.all([
            QuestionEditRequest.find({ schoolId, status: 'pending' })
                .populate('coachId', 'name email')
                .sort({ createdAt: -1 })
                .lean(),
            TrainingDataEdit.find({ schoolId, status: 'pending' })
                .populate('coachId', 'name email')
                .sort({ createdAt: -1 })
                .lean(),
        ]);
        return { questionEdits, contentEdits };
    }

    async reviewEditRequest(editId, reviewerId, { status, reviewNote = null, editType = null }) {
        if (editType === 'content') {
            return this._reviewContentEdit(editId, reviewerId, { status, reviewNote });
        }
        if (editType === 'question') {
            return this._reviewQuestionEdit(editId, reviewerId, { status, reviewNote });
        }

        const questionRequest = await QuestionEditRequest.findById(editId);
        if (questionRequest) {
            return this._reviewQuestionEdit(editId, reviewerId, { status, reviewNote });
        }
        return this._reviewContentEdit(editId, reviewerId, { status, reviewNote });
    }

    async _reviewQuestionEdit(editId, reviewerId, { status, reviewNote }) {
        const request = await QuestionEditRequest.findById(editId);
        if (!request) throw new ApiError(404, ERR.EDIT_REQUEST_NOT_FOUND);
        if (request.status !== 'pending') throw new ApiError(400, ERR.EDIT_ALREADY_REVIEWED);

        if (status === 'approved') {
            const bank = await QuestionBank.findById(request.questionBankId);
            const question = bank?.questions.id(request.questionId);
            if (question) {
                Object.assign(question, request.proposedChanges);
                await bank.save();
            }
        }

        request.status = status;
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();
        request.reviewNote = reviewNote;
        await request.save();

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: request.coachId,
            type: NOTIFICATION_TYPES.CONTENT_APPROVED,
            title: status === 'approved' ? 'تمت الموافقة على تعديل السؤال' : 'تم رفض تعديل السؤال',
            message: reviewNote || (status === 'approved' ? 'تم تطبيق التعديلات المقترحة.' : 'لم تُقبل التعديلات المقترحة.'),
            data: { editId: request._id },
        });

        return request;
    }

    async _reviewContentEdit(editId, reviewerId, { status, reviewNote }) {
        const request = await TrainingDataEdit.findById(editId);
        if (!request) throw new ApiError(404, ERR.EDIT_REQUEST_NOT_FOUND);
        if (request.status !== 'pending') throw new ApiError(400, ERR.EDIT_ALREADY_REVIEWED);

        if (status === 'approved') {
            const Model = CONTENT_MODELS[request.contentType];
            await Model.findByIdAndUpdate(request.contentId, request.proposedChanges, { runValidators: true });
        }

        request.status = status;
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();
        request.reviewNote = reviewNote;
        await request.save();

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: request.coachId,
            type: NOTIFICATION_TYPES.CONTENT_APPROVED,
            title: status === 'approved' ? 'تمت الموافقة على تعديل المحتوى' : 'تم رفض تعديل المحتوى',
            message: reviewNote || '',
            data: { editId: request._id },
        });

        return request;
    }

    async getSample({ tier = 'partial', categoryCode = 'B' } = {}) {
        const code = categoryCode.toUpperCase();
        const items = await TheoryContent.find({
            isSample: true,
            isActive: true,
            sampleTier: tier,
            categoryCode: code,
        })
            .sort({ order: 1 })
            .lean();

        const questions = [];
        for (const item of items) {
            for (const q of item.interactiveQuestions || []) {
                if (q.status === 'archived') continue;
                questions.push({
                    _id: q._id,
                    text: q.text,
                    type: q.type,
                    options: q.options,
                    imageUrl: q.imageUrl,
                    explanation: q.explanation,
                    correctAnswer: q.correctAnswer,
                    sourceTitle: item.title,
                });
            }
        }

        const limit = tier === 'full' ? 10 : 3;
        return {
            tier,
            categoryCode: code,
            questions: questions.slice(0, limit),
        };
    }
}

module.exports = new ContentService();
