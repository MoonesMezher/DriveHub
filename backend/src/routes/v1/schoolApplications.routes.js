const { Router } = require('express');
const schoolApplicationsController = require('../../controllers/schoolApplications.controller');
const { schoolApplicationRules } = require('../../validators/school.validator');
const { auth, validate, idParam, requirePermission } = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth);

router.post('/', requirePermission(PERMISSIONS.MANAGE_PROFILE), schoolApplicationRules, validate, schoolApplicationsController.submit);
router.get('/mine', requirePermission(PERMISSIONS.MANAGE_PROFILE), schoolApplicationsController.listMine);
router.get('/:id', ...idParam('id', 'الطلب'), schoolApplicationsController.getById);

module.exports = router;
