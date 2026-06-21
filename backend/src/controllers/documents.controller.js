const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const { documentService } = require('../services');
const { upload } = require('../middlewares/upload');

const uploadDocument = asyncHandler(async (req, res) => {
    const doc = await documentService.storeEncrypted({
        userId: req._user.userId,
        type: req.body.type,
        file: req.file,
    });
    return created(res, { document: doc }, 'تم رفع المستند');
});

const getDocument = asyncHandler(async (req, res) => {
    const doc = await documentService.getById(req.params.id, req._user.userId, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    return success(res, { document: { id: doc._id, type: doc.type, mime: doc.mime, uploadedAt: doc.uploadedAt } });
});

module.exports = { uploadDocument, getDocument, uploadMiddleware: upload.single('file') };
