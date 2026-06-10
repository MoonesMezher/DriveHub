const crypto = require('crypto');
const { DocumentUpload } = require('../models');
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

    async getById(id, userId) {
        const doc = await DocumentUpload.findOne({ _id: id, userId }).select('+encryptedPath');
        if (!doc) throw new ApiError(404, ERR.DOCUMENT_NOT_FOUND);
        return doc;
    }
}

module.exports = new DocumentService();
