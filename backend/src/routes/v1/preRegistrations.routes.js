const { Router } = require('express');
const preRegistrationsController = require('../../controllers/preRegistrations.controller');
const { preRegistrationRules } = require('../../validators/enrollment.validator');
const { auth, validate, idParam, requirePermission } = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth, requirePermission(PERMISSIONS.SUBMIT_ENROLLMENT));

router.get('/', preRegistrationsController.listMine);
router.post('/', preRegistrationRules, validate, preRegistrationsController.create);
router.delete('/:id', ...idParam('id', 'الحجز المسبق'), preRegistrationsController.cancel);

module.exports = router;
