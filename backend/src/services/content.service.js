const mongoose = require('mongoose');
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
const mediaService = require('./media.service');

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

    async _getStudentCategoryCode(userId, query = {}) {
        if (query.categoryCode) return query.categoryCode.toUpperCase();
        const enrollment = await getActiveEnrollment(userId);
        return enrollment?.categoryCode?.toUpperCase() || null;
    }

    async _getOrCreateUnlockRecord(userId, categoryCode, enrollmentId = null) {
        const code = categoryCode.toUpperCase();
        let record = await ContentUnlockMode.findOne({ userId, categoryCode: code });
        if (!record) {
            const enrollment = enrollmentId
                ? { _id: enrollmentId }
                : await getActiveEnrollment(userId);
            record = await ContentUnlockMode.create({
                userId,
                categoryCode: code,
                mode: enrollment ? 'full' : 'progressive',
                maxUnlockedPhase: enrollment ? null : 1,
                enrollmentId: enrollment?._id || enrollmentId || null,
                unlockedAt: enrollment ? new Date() : undefined,
            });
        }
        return record;
    }

    async _getMaxPhase(categoryCode, subTypeCode = null) {
        const filter = { isActive: true, categoryCode: categoryCode.toUpperCase() };
        if (subTypeCode) filter.subTypeCode = subTypeCode.toUpperCase();
        const [theoryMax, videoMax] = await Promise.all([
            TheoryContent.findOne(filter).sort({ phase: -1 }).select('phase').lean(),
            PracticalVideo.findOne(filter).sort({ phase: -1 }).select('phase').lean(),
        ]);
        return Math.max(theoryMax?.phase ?? 1, videoMax?.phase ?? 1, 1);
    }

    _applyProgressivePhaseFilter(filter, maxUnlockedPhase) {
        return {
            ...filter,
            $or: [
                { phase: { $lte: maxUnlockedPhase } },
                { phase: 0 },
            ],
        };
    }

    async _resolveStudentUnlock(userId, query = {}) {
        const categoryCode = await this._getStudentCategoryCode(userId, query);
        if (!categoryCode) {
            return { mode: 'full', categoryCode: null, maxUnlockedPhase: null, totalPhases: null };
        }

        const enrollment = await getActiveEnrollment(userId);
        const record = await this._getOrCreateUnlockRecord(
            userId,
            categoryCode,
            enrollment?._id || null,
        );
        const totalPhases = await this._getMaxPhase(categoryCode, enrollment?.subTypeCode);

        return {
            mode: record.mode,
            categoryCode,
            maxUnlockedPhase: record.maxUnlockedPhase ?? 1,
            totalPhases,
            viewedContentIds: record.viewedContentIds || [],
        };
    }

    async _assertTheoryAccess(userId, content) {
        const unlock = await this._resolveStudentUnlock(userId, { categoryCode: content.categoryCode });
        if (unlock.mode === 'full') return unlock;
        const phase = content.phase ?? 0;
        if (phase === 0 || phase <= unlock.maxUnlockedPhase) return unlock;
        throw new ApiError(403, ERR.CONTENT_LOCKED);
    }

    async _maybeAdvancePhase(userId, categoryCode, phase) {
        const code = categoryCode.toUpperCase();
        const record = await ContentUnlockMode.findOne({ userId, categoryCode: code });
        if (!record || record.mode !== 'progressive') return record;

        const phaseItems = await TheoryContent.find({
            isActive: true,
            categoryCode: code,
            phase,
        }).select('_id').lean();

        if (!phaseItems.length) return record;

        const viewed = new Set((record.viewedContentIds || []).map((id) => id.toString()));
        const allViewed = phaseItems.every((item) => viewed.has(item._id.toString()));
        if (!allViewed || phase < record.maxUnlockedPhase) return record;

        const totalPhases = await this._getMaxPhase(code);
        if (record.maxUnlockedPhase >= totalPhases) return record;

        record.maxUnlockedPhase = Math.min(totalPhases, record.maxUnlockedPhase + 1);
        await record.save();
        return record;
    }

    async listTheory(query = {}, userId = null) {
        const filter = this._buildFilter(query);
        if (userId) {
            const unlock = await this._resolveStudentUnlock(userId, query);
            if (unlock.mode === 'progressive' && unlock.categoryCode) {
                Object.assign(filter, this._applyProgressivePhaseFilter(filter, unlock.maxUnlockedPhase));
            }
            if (!filter.categoryCode && unlock.categoryCode) {
                filter.categoryCode = unlock.categoryCode;
            }
        }
        return TheoryContent.find(filter)
            .sort({ phase: 1, order: 1 })
            .select('-interactiveQuestions.correctAnswer')
            .lean();
    }

    async getTheoryById(id, userId = null) {
        const content = await TheoryContent.findOne({ _id: id, isActive: true }).lean();
        if (!content) throw new ApiError(404, ERR.CONTENT_NOT_FOUND);
        if (userId) await this._assertTheoryAccess(userId, content);
        if (content.interactiveQuestions?.length) {
            content.interactiveQuestions = stripAnswers(content.interactiveQuestions);
        }
        return content;
    }

    async completeTheoryContent(userId, contentId) {
        const content = await TheoryContent.findOne({ _id: contentId, isActive: true });
        if (!content) throw new ApiError(404, ERR.CONTENT_NOT_FOUND);

        const enrollment = await getActiveEnrollment(userId, { required: true });
        const record = await this._getOrCreateUnlockRecord(userId, content.categoryCode, enrollment._id);

        if (record.mode === 'progressive') {
            const phase = content.phase ?? 0;
            if (phase > 0 && phase > record.maxUnlockedPhase) {
                throw new ApiError(403, ERR.CONTENT_LOCKED);
            }
        }

        const contentOid = content._id;
        const alreadyViewed = (record.viewedContentIds || []).some((id) => id.equals(contentOid));
        if (!alreadyViewed) {
            record.viewedContentIds = [...(record.viewedContentIds || []), contentOid];
            await record.save();
        }

        const updated = await this._maybeAdvancePhase(userId, content.categoryCode, content.phase ?? 0);
        const totalPhases = await this._getMaxPhase(content.categoryCode, enrollment.subTypeCode);

        return {
            contentId: content._id,
            phase: content.phase,
            maxUnlockedPhase: updated?.maxUnlockedPhase ?? record.maxUnlockedPhase,
            totalPhases,
            mode: record.mode,
        };
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

    async listVideos(query = {}, userId = null) {
        const filter = this._buildFilter(query);
        if (userId) {
            const unlock = await this._resolveStudentUnlock(userId, query);
            if (unlock.mode === 'progressive' && unlock.categoryCode) {
                Object.assign(filter, this._applyProgressivePhaseFilter(filter, unlock.maxUnlockedPhase));
            }
            if (!filter.categoryCode && unlock.categoryCode) {
                filter.categoryCode = unlock.categoryCode;
            }
        }
        return PracticalVideo.find(filter)
            .sort({ phase: 1, order: 1 })
            .lean();
    }

    async getUnlockMode(userId, query = {}) {
        const categoryCode = (query.categoryCode || '').toUpperCase();
        if (!categoryCode) {
            const enrollment = await getActiveEnrollment(userId);
            if (!enrollment) {
                return { mode: 'progressive', categoryCode: null, maxUnlockedPhase: 1, totalPhases: null };
            }
            const unlock = await this._resolveStudentUnlock(userId, { categoryCode: enrollment.categoryCode });
            return {
                mode: unlock.mode,
                categoryCode: enrollment.categoryCode,
                maxUnlockedPhase: unlock.maxUnlockedPhase,
                totalPhases: unlock.totalPhases,
            };
        }
        const unlock = await this._resolveStudentUnlock(userId, { categoryCode });
        return {
            mode: unlock.mode,
            categoryCode,
            maxUnlockedPhase: unlock.maxUnlockedPhase,
            totalPhases: unlock.totalPhases,
        };
    }

    async grantFullContentAccess(userId, categoryCode, enrollmentId = null) {
        return this.setUnlockMode(userId, {
            categoryCode,
            mode: 'full',
            enrollmentId,
        }, { staff: true });
    }

    async setUnlockMode(userId, { categoryCode, mode, enrollmentId = null }, { staff = false } = {}) {
        if (!staff && mode === 'progressive') {
            throw new ApiError(403, ERR.CONTENT_UNLOCK_STAFF_ONLY);
        }
        const code = categoryCode.toUpperCase();
        const update = {
            userId,
            categoryCode: code,
            mode,
            enrollmentId,
            unlockedAt: new Date(),
        };
        if (mode === 'progressive') {
            update.maxUnlockedPhase = 1;
            update.viewedContentIds = [];
        }
        return ContentUnlockMode.findOneAndUpdate(
            { userId, categoryCode: code },
            update,
            { upsert: true, new: true, runValidators: true },
        );
    }

    async _normalizeContentImages(data, fields = []) {
        const payload = { ...data };
        for (const field of fields) {
            if (!payload[field]) continue;
            payload[field] = mediaService.normalizeImageRef(payload[field]);
            await mediaService.assertMediaExists(payload[field]);
        }
        return payload;
    }

    async createTheory(data, adminId) {
        const payload = await this._normalizeContentImages(data, ['imageUrl']);
        return TheoryContent.create({ ...payload, categoryCode: payload.categoryCode.toUpperCase(), updatedBy: adminId });
    }

    async createShared(data, adminId) {
        const payload = await this._normalizeContentImages(data, ['mediaUrl']);
        return TrainingContentShared.create({ ...payload, updatedBy: adminId });
    }

    async createSpecific(data, adminId) {
        const payload = await this._normalizeContentImages(data, ['mediaUrl']);
        return TrainingContentSpecific.create({
            ...payload,
            categoryCode: payload.categoryCode.toUpperCase(),
            updatedBy: adminId,
        });
    }

    async createVideo(data) {
        const payload = await this._normalizeContentImages(data, ['thumbnailUrl']);
        return PracticalVideo.create({ ...payload, categoryCode: payload.categoryCode.toUpperCase() });
    }

    async _buildSystemQuestionBanks(query = {}) {
        const theoryFilter = { isActive: true };
        if (query.categoryCode) theoryFilter.categoryCode = query.categoryCode.toUpperCase();

        const theoryItems = await TheoryContent.find(theoryFilter)
            .select('title categoryCode subTypeCode interactiveQuestions')
            .sort({ order: 1, createdAt: -1 })
            .lean();

        const byCategory = new Map();
        for (const content of theoryItems) {
            const code = (content.categoryCode || '').toUpperCase();
            if (!code) continue;
            if (!byCategory.has(code)) {
                byCategory.set(code, {
                    _id: `system-${code}`,
                    title: `بنك النظام — فئة ${code}`,
                    categoryCode: code,
                    subTypeCode: null,
                    status: 'active',
                    isSystem: true,
                    questions: [],
                });
            }
            const bank = byCategory.get(code);
            for (const q of content.interactiveQuestions || []) {
                if (q.status === 'archived') continue;
                bank.questions.push({
                    ...(q.toObject ? q.toObject() : q),
                    sourceTitle: content.title,
                    sourceContentId: content._id,
                });
            }
        }

        return [...byCategory.values()].filter((b) => b.questions.length > 0);
    }

    async listQuestionBanks(schoolId, query = {}) {
        const filter = { status: { $ne: 'archived' } };
        if (schoolId) filter.schoolId = schoolId;
        if (query.categoryCode) filter.categoryCode = query.categoryCode.toUpperCase();

        const [schoolBanks, systemBanks] = await Promise.all([
            QuestionBank.find(filter).sort({ createdAt: -1 }).lean(),
            this._buildSystemQuestionBanks(query),
        ]);

        return [...systemBanks, ...schoolBanks.map((b) => ({ ...b, isSystem: false }))];
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
        const payload = await this._normalizeContentImages(questionData, ['imageUrl']);
        bank.questions.push(payload);
        await bank.save();
        return bank.questions[bank.questions.length - 1];
    }

    async updateQuestion(bankId, questionId, questionData, schoolId = null) {
        const filter = { _id: bankId };
        if (schoolId) filter.schoolId = schoolId;
        const bank = await QuestionBank.findOne(filter);
        if (!bank) throw new ApiError(404, ERR.QUESTION_BANK_NOT_FOUND);

        const question = bank.questions.id(questionId);
        if (!question) throw new ApiError(404, ERR.QUESTION_NOT_FOUND);

        const payload = await this._normalizeContentImages(questionData, ['imageUrl']);
        const fields = ['text', 'type', 'options', 'correctAnswer', 'explanation', 'imageUrl', 'difficulty', 'status'];
        for (const field of fields) {
            if (payload[field] !== undefined) question[field] = payload[field];
        }
        await bank.save();
        return question;
    }

    /** Manager: full theory article including inactive / answers */
    async getTheoryForManager(id) {
        const content = await TheoryContent.findById(id).lean();
        if (!content) throw new ApiError(404, ERR.CONTENT_NOT_FOUND);
        return content;
    }

    async getQuestionBankById(bankId, schoolId = null) {
        if (typeof bankId === 'string' && bankId.startsWith('system-')) {
            const categoryCode = bankId.slice('system-'.length).toUpperCase();
            const systemBanks = await this._buildSystemQuestionBanks({ categoryCode });
            const bank = systemBanks.find((b) => b._id === `system-${categoryCode}` || b.categoryCode === categoryCode);
            if (!bank) throw new ApiError(404, ERR.QUESTION_BANK_NOT_FOUND);
            return bank;
        }

        if (!mongoose.Types.ObjectId.isValid(bankId)) {
            throw new ApiError(404, ERR.QUESTION_BANK_NOT_FOUND);
        }

        const filter = { _id: bankId };
        if (schoolId) filter.schoolId = schoolId;
        const bank = await QuestionBank.findOne(filter).lean();
        if (!bank) throw new ApiError(404, ERR.QUESTION_BANK_NOT_FOUND);
        return { ...bank, isSystem: false };
    }

    async getQuestionById(bankId, questionId, schoolId = null) {
        const bank = await this.getQuestionBankById(bankId, schoolId);
        const questions = bank.questions || [];
        const question = questions.find((q) => String(q._id) === String(questionId));
        if (!question) throw new ApiError(404, ERR.QUESTION_NOT_FOUND);
        return {
            question: {
                ...(question.toObject ? question.toObject() : question),
                categoryCode: question.categoryCode || bank.categoryCode,
            },
            bank: {
                _id: bank._id,
                title: bank.title,
                categoryCode: bank.categoryCode,
                subTypeCode: bank.subTypeCode,
                status: bank.status,
                isSystem: Boolean(bank.isSystem),
                createdAt: bank.createdAt,
                updatedAt: bank.updatedAt,
            },
        };
    }

    async _getCoachSchoolId(coachId) {
        const instructor = await Instructor.findOne({ userId: coachId, status: 'active' });
        if (!instructor) throw new ApiError(403, ERR.COACH_NOT_IN_SCHOOL);
        return instructor.schoolId;
    }

    async listCoachQuestionBanks(coachId) {
        const schoolId = await this._getCoachSchoolId(coachId);
        return this.listQuestionBanks(schoolId);
    }

    async listCoachContent(contentType) {
        const Model = CONTENT_MODELS[contentType];
        if (!Model) throw new ApiError(400, ERR.VALIDATION_FAILED);

        const projection = {
            theory: 'title categoryCode subTypeCode phase',
            shared: 'title section',
            specific: 'title categoryCode subTypeCode section',
            video: 'title categoryCode subTypeCode phase',
        }[contentType];

        return Model.find({ isActive: true })
            .select(projection)
            .sort({ order: 1, createdAt: -1 })
            .lean();
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

        const articles = items.map((item) => ({
            _id: item._id,
            title: item.title,
            body: item.body,
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
        }));

        const sampleVideos = await PracticalVideo.find({
            isSample: true,
            isActive: true,
            categoryCode: code,
        })
            .sort({ order: 1 })
            .select('title url thumbnailUrl durationSeconds')
            .lean();

        const videos = tier === 'full'
            ? sampleVideos
            : sampleVideos.slice(0, 1);

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
            articles,
            videos,
            questions: questions.slice(0, limit),
        };
    }
}

module.exports = new ContentService();
