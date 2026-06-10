const { Router } = require('express');
const adminController = require('../../controllers/admin.controller');
const { moderateReviewRules } = require('../../validators/review.validator');
const { reviewSchoolApplicationRules } = require('../../validators/school.validator');
const {
    upsertPricingRules,
    updateCommissionRules,
    createAdRules,
    assignRoleRules,
    suspendUserRules,
} = require('../../validators/admin.validator');
const { upsertCategoryRules, upsertSubTypeRules } = require('../../validators/license.validator');
const { createSchoolRules, updateSchoolRules } = require('../../validators/school.validator');
const { distributeRosterRules } = require('../../validators/roster.validator');
const { paginationQuery } = require('../../validators/common.validator');
const {
    auth, validate, idParam, attachPagination, requirePermission, audit,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');
const router = Router();

router.use(auth, requirePermission(PERMISSIONS.ACCESS_ADMIN_PORTAL));

// Pricing
router.get('/pricing', requirePermission(PERMISSIONS.MANAGE_PLATFORM_PRICING), adminController.listPricing);
router.put('/pricing', requirePermission(PERMISSIONS.MANAGE_PLATFORM_PRICING), upsertPricingRules, validate, audit('admin.pricing.upsert'), adminController.upsertPricing);
router.patch('/commission', requirePermission(PERMISSIONS.MANAGE_PLATFORM_PRICING), updateCommissionRules, validate, adminController.updateCommission);

// Licenses
router.get('/licenses', requirePermission(PERMISSIONS.MANAGE_PLATFORM_PRICING), adminController.listLicenses);
router.put('/licenses/categories', requirePermission(PERMISSIONS.MANAGE_PLATFORM_PRICING), upsertCategoryRules, validate, adminController.upsertLicense);
router.put('/licenses/sub-types', requirePermission(PERMISSIONS.MANAGE_PLATFORM_PRICING), upsertSubTypeRules, validate, adminController.upsertSubType);

// Schools
router.get('/schools', requirePermission(PERMISSIONS.MANAGE_SCHOOLS), attachPagination, paginationQuery, validate, adminController.listSchools);
router.post('/schools', requirePermission(PERMISSIONS.MANAGE_SCHOOLS), createSchoolRules, validate, audit('admin.school.create'), adminController.createSchool);
router.patch('/schools/:id', ...idParam('id', 'المدرسة'), requirePermission(PERMISSIONS.MANAGE_SCHOOLS), updateSchoolRules, validate, adminController.updateSchool);

// School applications
router.get('/school-applications', requirePermission(PERMISSIONS.APPROVE_SCHOOL_APPLICATIONS), adminController.listApplications);
router.post('/school-applications/:id/review', ...idParam('id', 'الطلب'), requirePermission(PERMISSIONS.APPROVE_SCHOOL_APPLICATIONS), reviewSchoolApplicationRules, validate, audit('admin.schoolApplication.review'), adminController.reviewApplication);

// Users & roles
router.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), attachPagination, paginationQuery, validate, adminController.listUsers);
router.post('/users/roles', requirePermission(PERMISSIONS.MANAGE_USERS), assignRoleRules, validate, audit('admin.user.assignRole'), adminController.assignRole);
router.patch('/users/:id/status', ...idParam('id', 'المستخدم'), requirePermission(PERMISSIONS.MANAGE_USERS), suspendUserRules, validate, adminController.suspendUser);

// Reviews moderation
router.get('/reviews/pending', adminController.listPendingReviews);
router.patch('/reviews/:id/moderate', ...idParam('id', 'التقييم'), moderateReviewRules, validate, adminController.moderateReview);

// Ads
router.get('/ads', requirePermission(PERMISSIONS.MANAGE_ADS), adminController.listAds);
router.post('/ads', requirePermission(PERMISSIONS.MANAGE_ADS), createAdRules, validate, adminController.createAd);
router.patch('/ads/:id', ...idParam('id', 'الإعلان'), requirePermission(PERMISSIONS.MANAGE_ADS), adminController.updateAd);

// Traffic distribution & rosters
router.post('/traffic/distribute', requirePermission(PERMISSIONS.DISTRIBUTE_TRAFFIC_DATA), distributeRosterRules, validate, audit('admin.traffic.distribute'), adminController.distributeRosters);

// Audit & reports
router.get('/audit', requirePermission(PERMISSIONS.VIEW_AUDIT_LOG), adminController.listAudit);
router.get('/reports', requirePermission(PERMISSIONS.VIEW_PLATFORM_REPORTS), adminController.reports);

module.exports = router;
