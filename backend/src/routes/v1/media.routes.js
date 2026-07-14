const { Router } = require('express');
const {
    uploadImage,
    serveImage,
    uploadMiddleware,
} = require('../../controllers/media.controller');
const { uploadMediaRules } = require('../../validators/media.validator');
const { auth, validate, requireAnyPermission } = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');
const { mongoIdParam } = require('../../validators/common.validator');

const router = Router();

router.get('/:id', mongoIdParam('id', 'الصورة'), validate, serveImage);

router.post(
    '/',
    auth,
    requireAnyPermission(
        PERMISSIONS.UPLOAD_MEDIA,
        PERMISSIONS.MANAGE_ADS,
        PERMISSIONS.MANAGE_QUESTION_BANK,
        PERMISSIONS.APPROVE_CONTENT_EDITS,
        PERMISSIONS.EDIT_TRAINING_CONTENT,
    ),
    uploadMiddleware,
    uploadMediaRules,
    validate,
    uploadImage,
);

module.exports = router;
