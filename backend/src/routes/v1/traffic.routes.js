const { Router } = require('express');
const trafficController = require('../../controllers/traffic.controller');
const {
    trafficScheduleRules,
    trafficResultRules,
    trafficBulkResultRules,
    drivingLicenseRecordRules,
} = require('../../validators/exam.validator');
const { paginationQuery } = require('../../validators/common.validator');
const {
    auth, validate, idParam, attachPagination, requirePermission, audit,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth, requirePermission(PERMISSIONS.ACCESS_TRAFFIC_PORTAL));

router.get('/dashboard', requirePermission(PERMISSIONS.VIEW_TRAFFIC_DASHBOARD), trafficController.dashboard);

router.get('/rosters', requirePermission(PERMISSIONS.VIEW_TRAFFIC_ROSTERS), attachPagination, paginationQuery, validate, trafficController.listRosters);
router.get('/rosters/:id', ...idParam('id', 'القائمة'), requirePermission(PERMISSIONS.VIEW_TRAFFIC_ROSTERS), trafficController.getRoster);

router.get('/schedules', requirePermission(PERMISSIONS.MANAGE_EXAM_SCHEDULES), trafficController.listSchedules);
router.post('/schedules', requirePermission(PERMISSIONS.MANAGE_EXAM_SCHEDULES), trafficScheduleRules, validate, audit('traffic.schedule.create'), trafficController.createSchedule);
router.patch('/schedules/:id', ...idParam('id', 'الموعد'), requirePermission(PERMISSIONS.MANAGE_EXAM_SCHEDULES), trafficController.updateSchedule);

router.get('/results', requirePermission(PERMISSIONS.ENTER_EXAM_RESULTS), trafficController.listResults);
router.get('/enrollments', requirePermission(PERMISSIONS.ACCESS_TRAFFIC_PORTAL), trafficController.listEnrollments);

router.post(
    '/results/bulk',
    requirePermission(PERMISSIONS.ENTER_EXAM_RESULTS),
    trafficBulkResultRules,
    validate,
    audit('traffic.result.bulk'),
    trafficController.bulkEnterResults,
);
router.post('/results', requirePermission(PERMISSIONS.ENTER_EXAM_RESULTS), trafficResultRules, validate, audit('traffic.result.enter'), trafficController.enterResult);

router.post('/licenses', requirePermission(PERMISSIONS.ENTER_EXAM_RESULTS), drivingLicenseRecordRules, validate, audit('traffic.license.issue'), trafficController.issueLicense);

module.exports = router;
