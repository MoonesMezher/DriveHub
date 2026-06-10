const { Router } = require('express');
const { uploadDocument, getDocument, uploadMiddleware } = require('../../controllers/documents.controller');
const { uploadDocumentRules } = require('../../validators/document.validator');
const {
    auth, validate, idParam, requirePermission,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

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
router.get('/:id', ...idParam('id', 'المستند'), requirePermission(PERMISSIONS.MANAGE_PROFILE), getDocument);

module.exports = router;
