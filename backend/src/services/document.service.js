const { DocumentUpload, DocumentAccessLog, Enrollment } = require('../models');
const { encrypt, decrypt } = require('../utils/encryption');
const { mimeMatchesBuffer } = require('../utils/fileSignature');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { ALLOWED_MIME, MAX_FILE_SIZE } = require('../middlewares/upload');
const { REQUIRED_ENROLLMENT_DOCUMENT_TYPES } = require('../constants/requiredDocuments');
const { DOCUMENT_TYPES } = require('../constants/documentTypes');
const { PERMISSIONS: P } = require('../constants/permissions');
const { ROLES } = require('../constants/roles');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

const MANAGER_REVIEW_STATUSES = [
    ENROLLMENT_STATUS.SUBMITTED,
    ENROLLMENT_STATUS.UNDER_REVIEW,
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.AWAITING_PAYMENT,
    ENROLLMENT_STATUS.PAID,
    ENROLLMENT_STATUS.ACTIVE,
];

class DocumentService {
    validateUpload(file) {
        if (!file) throw new ApiError(400, ERR.NO_FILE);
        if (!ALLOWED_MIME.has(file.mimetype)) {
            throw new ApiError(400, ERR.INVALID_FILE_TYPE);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new ApiError(400, ERR.FILE_TOO_LARGE);
        }
        if (!file.buffer?.length || !mimeMatchesBuffer(file.buffer, file.mimetype)) {
            throw new ApiError(400, ERR.FILE_SIGNATURE_MISMATCH);
        }
    }

    async storeEncrypted({ userId, type, file }) {
        this.validateUpload(file);
        const payload = file.buffer.toString('base64');
        const encryptedPath = encrypt(payload);

        return DocumentUpload.create({
            userId,
            type,
            encryptedPath,
            mime: file.mimetype,
            originalName: file.originalname,
            size: file.size,
        });
    }

    async logAccess(documentId, userId, { action = 'view', ip = null, userAgent = null } = {}) {
        return DocumentAccessLog.create({
            documentId,
            userId,
            action,
            ip,
            userAgent,
        });
    }

    _requesterContext(requester = {}) {
        return {
            userId: requester.userId,
            permissions: requester.permissions || [],
            role: requester.role,
            schoolId: requester.schoolId || requester.schoolScope || null,
        };
    }

    async _canManagerVerifyDocument(doc, schoolId) {
        if (!schoolId) return false;
        const enrollment = await Enrollment.findOne({
            userId: doc.userId,
            schoolId,
            status: { $in: MANAGER_REVIEW_STATUSES },
        })
            .select('_id')
            .lean();
        return Boolean(enrollment);
    }

    async resolveAccess(id, requester, meta = {}) {
        const ctx = this._requesterContext(requester);
        const doc = await DocumentUpload.findById(id).select('+encryptedPath');
        if (!doc) throw new ApiError(404, ERR.DOCUMENT_NOT_FOUND);

        const isOwner = String(doc.userId) === String(ctx.userId);
        const isAdmin = ctx.role === ROLES.ADMIN || ctx.permissions.includes(P.VIEW_DOCUMENT_AUDIT);
        const canManagerVerify = ctx.permissions.includes(P.VERIFY_ENROLLMENT_DOCUMENTS)
            && await this._canManagerVerifyDocument(doc, ctx.schoolId);

        if (!isOwner && !isAdmin && !canManagerVerify) {
            throw new ApiError(403, ERR.FORBIDDEN);
        }

        await this.logAccess(doc._id, ctx.userId, {
            action: meta.action || 'view',
            ip: meta.ip || null,
            userAgent: meta.userAgent || null,
        });

        return doc;
    }

    async getById(id, requester, meta = {}) {
        const doc = await this.resolveAccess(id, requester, { ...meta, action: 'view' });
        return doc;
    }

    async downloadDecrypted(id, requester, meta = {}) {
        const doc = await this.resolveAccess(id, requester, { ...meta, action: 'download' });
        const base64 = decrypt(doc.encryptedPath);
        return {
            buffer: Buffer.from(base64, 'base64'),
            mime: doc.mime,
            originalName: doc.originalName,
            size: doc.size,
        };
    }

    async listByUser(userId) {
        return DocumentUpload.find({ userId })
            .select('-encryptedPath')
            .sort({ uploadedAt: -1 })
            .lean();
    }

    async getPresentTypes(userId) {
        const docs = await DocumentUpload.find({ userId }).select('type').lean();
        return new Set(docs.map((d) => d.type));
    }

    getMissingRequiredTypes(presentTypes) {
        return REQUIRED_ENROLLMENT_DOCUMENT_TYPES.filter((type) => !presentTypes.has(type));
    }

    async assertRequiredForEnrollment(userId) {
        const present = await this.getPresentTypes(userId);
        const missing = this.getMissingRequiredTypes(present);
        if (!missing.length) return;

        const hasNationalId = !missing.includes(DOCUMENT_TYPES.NATIONAL_ID);
        const hasMedical = !missing.includes(DOCUMENT_TYPES.MEDICAL_REPORT);

        if (!hasNationalId && !hasMedical) {
            throw new ApiError(400, ERR.ENROLLMENT_DOCUMENTS_REQUIRED);
        }
        if (!hasNationalId) {
            throw new ApiError(400, ERR.ENROLLMENT_NATIONAL_ID_REQUIRED);
        }
        throw new ApiError(400, ERR.ENROLLMENT_MEDICAL_REPORT_REQUIRED);
    }

    async listForEnrollment(enrollmentId, requester) {
        const ctx = this._requesterContext(requester);
        const enrollment = await Enrollment.findById(enrollmentId).lean();
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const isAdmin = ctx.role === ROLES.ADMIN || ctx.permissions.includes(P.VIEW_DOCUMENT_AUDIT);
        const isManager = ctx.permissions.includes(P.VERIFY_ENROLLMENT_DOCUMENTS)
            && ctx.schoolId
            && String(enrollment.schoolId) === String(ctx.schoolId);

        if (!isAdmin && !isManager) {
            throw new ApiError(403, ERR.FORBIDDEN);
        }

        return DocumentUpload.find({ userId: enrollment.userId })
            .select('-encryptedPath')
            .sort({ uploadedAt: -1 })
            .lean();
    }

    async listAccessLogs(documentId, requester) {
        const ctx = this._requesterContext(requester);
        const isAdmin = ctx.role === ROLES.ADMIN || ctx.permissions.includes(P.VIEW_DOCUMENT_AUDIT);
        if (!isAdmin) throw new ApiError(403, ERR.FORBIDDEN);

        const doc = await DocumentUpload.findById(documentId).lean();
        if (!doc) throw new ApiError(404, ERR.DOCUMENT_NOT_FOUND);

        return DocumentAccessLog.find({ documentId })
            .populate('userId', 'name email')
            .sort({ at: -1 })
            .limit(50)
            .lean();
    }
}

module.exports = new DocumentService();
