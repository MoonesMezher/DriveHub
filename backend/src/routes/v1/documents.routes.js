const { Router } = require('express');
const {
    uploadDocument,
    listDocuments,
    getDocument,
    downloadDocument,
    listEnrollmentDocuments,
    listDocumentAccessLogs,
    uploadMiddleware,
} = require('../../controllers/documents.controller');
const { uploadDocumentRules } = require('../../validators/document.validator');
const {
    auth, validate, idParam, requirePermission, requireAnyPermission, schoolScope,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');
const { mongoIdParam } = require('../../validators/common.validator');

const router = Router();

router.use(auth);

router.post(
    '/',
    requirePermission(PERMISSIONS.MANAGE_PROFILE),
    uploadMiddleware,
    uploadDocumentRules,
    validate,
    uploadDocument,
);

router.get('/', requirePermission(PERMISSIONS.MANAGE_PROFILE), listDocuments);

router.get(
    '/enrollment/:enrollmentId',
    schoolScope,
    mongoIdParam('enrollmentId', 'الاشتراك'),
    validate,
    requireAnyPermission(PERMISSIONS.VERIFY_ENROLLMENT_DOCUMENTS, PERMISSIONS.VIEW_DOCUMENT_AUDIT),
    listEnrollmentDocuments,
);

router.get(
    '/:id/download',
    ...idParam('id', 'المستند'),
    requireAnyPermission(
        PERMISSIONS.MANAGE_PROFILE,
        PERMISSIONS.VERIFY_ENROLLMENT_DOCUMENTS,
        PERMISSIONS.VIEW_DOCUMENT_AUDIT,
    ),
    downloadDocument,
);

router.get(
    '/:id/access-logs',
    ...idParam('id', 'المستند'),
    requirePermission(PERMISSIONS.VIEW_DOCUMENT_AUDIT),
    listDocumentAccessLogs,
);

router.get(
    '/:id',
    ...idParam('id', 'المستند'),
    requireAnyPermission(
        PERMISSIONS.MANAGE_PROFILE,
        PERMISSIONS.VERIFY_ENROLLMENT_DOCUMENTS,
        PERMISSIONS.VIEW_DOCUMENT_AUDIT,
    ),
    getDocument,
);

module.exports = router;
