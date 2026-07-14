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

const listDocuments = asyncHandler(async (req, res) => {
    const documents = await documentService.listByUser(req._user.userId);
    return success(res, { documents });
});

const getDocument = asyncHandler(async (req, res) => {
    const doc = await documentService.getById(req.params.id, req._user, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    return success(res, {
        document: {
            id: doc._id,
            type: doc.type,
            mime: doc.mime,
            originalName: doc.originalName,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
        },
    });
});

const downloadDocument = asyncHandler(async (req, res) => {
    const file = await documentService.downloadDecrypted(req.params.id, req._user, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Content-Length', file.buffer.length);
    res.setHeader('Cache-Control', 'no-store, private');
    return res.send(file.buffer);
});

const listEnrollmentDocuments = asyncHandler(async (req, res) => {
    const documents = await documentService.listForEnrollment(req.params.enrollmentId, {
        ...req._user,
        schoolScope: req.schoolScope,
    });
    return success(res, { documents });
});

const listDocumentAccessLogs = asyncHandler(async (req, res) => {
    const logs = await documentService.listAccessLogs(req.params.id, req._user);
    return success(res, { logs });
});

module.exports = {
    uploadDocument,
    listDocuments,
    getDocument,
    downloadDocument,
    listEnrollmentDocuments,
    listDocumentAccessLogs,
    uploadMiddleware: upload.single('file'),
};
