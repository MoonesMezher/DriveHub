const { Router } = require('express');
const { getProfile, updateProfile } = require('../../controllers/profile.controller');
const { updateProfileRules } = require('../../validators/auth.validator');
const handleValidationErrors = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../policies/authorize');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth);
router.get('/', requirePermission(PERMISSIONS.MANAGE_PROFILE), getProfile);
router.patch('/', requirePermission(PERMISSIONS.MANAGE_PROFILE), updateProfileRules, handleValidationErrors, updateProfile);

module.exports = router;
