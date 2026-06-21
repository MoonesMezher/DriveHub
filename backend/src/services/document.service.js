const { DocumentUpload, DocumentAccessLog } = require('../models');
const { encrypt } = require('../utils/encryption');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { ALLOWED_MIME, MAX_FILE_SIZE } = require('../middlewares/upload');

class DocumentService {
    validateUpload(file) {
        if (!file) throw new ApiError(400, ERR.NO_FILE);
        if (!ALLOWED_MIME.has(file.mimetype)) {
            throw new ApiError(400, ERR.INVALID_FILE_TYPE);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new ApiError(400, ERR.FILE_TOO_LARGE);
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

    async getById(id, userId, meta = {}) {
        const doc = await DocumentUpload.findOne({ _id: id, userId }).select('+encryptedPath');
        if (!doc) throw new ApiError(404, ERR.DOCUMENT_NOT_FOUND);

        await this.logAccess(doc._id, userId, {
            action: 'view',
            ip: meta.ip || null,
            userAgent: meta.userAgent || null,
        });

        return doc;
    }

    async listAccessLogs(documentId, userId) {
        const doc = await DocumentUpload.findOne({ _id: documentId, userId }).lean();
        if (!doc) throw new ApiError(404, ERR.DOCUMENT_NOT_FOUND);
        return DocumentAccessLog.find({ documentId })
            .sort({ at: -1 })
            .limit(20)
            .lean();
    }
}

module.exports = new DocumentService();
