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
    updatePrivacyRules,
    updateRegistrationRules,
    createTrafficAccountRules,
    rejectComplianceRules,
} = require('../../validators/admin.validator');
const { upsertCategoryRules, upsertSubTypeRules } = require('../../validators/license.validator');
const { createFaqRules, updateFaqRules } = require('../../validators/faq.validator');
const { createRequirementRules, updateRequirementRules } = require('../../validators/requirement.validator');
const { createTestimonialRules, updateTestimonialRules } = require('../../validators/testimonial.validator');
const { createSchoolRules, updateSchoolRules } = require('../../validators/school.validator');
const { distributeRosterRules } = require('../../validators/roster.validator');
const { confirmPaymentRules, walletCreditRules } = require('../../validators/payment.validator');
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

// FAQ
router.get('/faq', requirePermission(PERMISSIONS.MANAGE_FAQ), adminController.listFaq);
router.post('/faq', requirePermission(PERMISSIONS.MANAGE_FAQ), createFaqRules, validate, audit('admin.faq.create'), adminController.createFaq);
router.patch('/faq/:id', ...idParam('id', 'السؤال'), requirePermission(PERMISSIONS.MANAGE_FAQ), updateFaqRules, validate, audit('admin.faq.update'), adminController.updateFaq);
router.delete('/faq/:id', ...idParam('id', 'السؤال'), requirePermission(PERMISSIONS.MANAGE_FAQ), audit('admin.faq.delete'), adminController.deleteFaq);

// Registration requirements
router.get('/requirements', requirePermission(PERMISSIONS.MANAGE_REQUIREMENTS), adminController.listRequirements);
router.post('/requirements', requirePermission(PERMISSIONS.MANAGE_REQUIREMENTS), createRequirementRules, validate, audit('admin.requirements.create'), adminController.createRequirement);
router.patch('/requirements/:id', ...idParam('id', 'المتطلب'), requirePermission(PERMISSIONS.MANAGE_REQUIREMENTS), updateRequirementRules, validate, audit('admin.requirements.update'), adminController.updateRequirement);
router.delete('/requirements/:id', ...idParam('id', 'المتطلب'), requirePermission(PERMISSIONS.MANAGE_REQUIREMENTS), audit('admin.requirements.delete'), adminController.deleteRequirement);

// Testimonials
router.get('/testimonials', requirePermission(PERMISSIONS.MANAGE_TESTIMONIALS), adminController.listTestimonials);
router.post('/testimonials', requirePermission(PERMISSIONS.MANAGE_TESTIMONIALS), createTestimonialRules, validate, audit('admin.testimonials.create'), adminController.createTestimonial);
router.patch('/testimonials/:id', ...idParam('id', 'الرأي'), requirePermission(PERMISSIONS.MANAGE_TESTIMONIALS), updateTestimonialRules, validate, audit('admin.testimonials.update'), adminController.updateTestimonial);
router.delete('/testimonials/:id', ...idParam('id', 'الرأي'), requirePermission(PERMISSIONS.MANAGE_TESTIMONIALS), audit('admin.testimonials.delete'), adminController.deleteTestimonial);

// Schools
router.get('/schools', requirePermission(PERMISSIONS.MANAGE_SCHOOLS), attachPagination, paginationQuery, validate, adminController.listSchools);
router.post('/schools', requirePermission(PERMISSIONS.MANAGE_SCHOOLS), createSchoolRules, validate, audit('admin.school.create'), adminController.createSchool);
router.patch('/schools/:id', ...idParam('id', 'المدرسة'), requirePermission(PERMISSIONS.MANAGE_SCHOOLS), updateSchoolRules, validate, adminController.updateSchool);
router.delete('/schools/:id', ...idParam('id', 'المدرسة'), requirePermission(PERMISSIONS.MANAGE_SCHOOLS), audit('admin.school.delete'), adminController.deleteSchool);

// School applications
router.get('/school-applications', requirePermission(PERMISSIONS.APPROVE_SCHOOL_APPLICATIONS), adminController.listApplications);
router.post('/school-applications/:id/review', ...idParam('id', 'الطلب'), requirePermission(PERMISSIONS.APPROVE_SCHOOL_APPLICATIONS), reviewSchoolApplicationRules, validate, audit('admin.schoolApplication.review'), adminController.reviewApplication);

// Compliance requests
router.get('/compliance', requirePermission(PERMISSIONS.VIEW_COMPLIANCE), adminController.listComplianceRequests);
router.get('/compliance/:id', ...idParam('id', 'طلب الامتثال'), requirePermission(PERMISSIONS.VIEW_COMPLIANCE), adminController.getComplianceRequestById);
router.post('/compliance/:id/approve', ...idParam('id', 'طلب الامتثال'), requirePermission(PERMISSIONS.MANAGE_COMPLIANCE), audit('admin.compliance.approve'), adminController.approveComplianceRequest);
router.post('/compliance/:id/reject', ...idParam('id', 'طلب الامتثال'), requirePermission(PERMISSIONS.MANAGE_COMPLIANCE), rejectComplianceRules, validate, audit('admin.compliance.reject'), adminController.rejectComplianceRequest);

// Users & roles
router.get('/users', requirePermission(PERMISSIONS.MANAGE_USERS), attachPagination, paginationQuery, validate, adminController.listUsers);
router.post('/users/roles', requirePermission(PERMISSIONS.MANAGE_USERS), assignRoleRules, validate, audit('admin.user.assignRole'), adminController.assignRole);
router.post('/users/traffic-accounts', requirePermission(PERMISSIONS.MANAGE_USERS), createTrafficAccountRules, validate, audit('admin.user.createTraffic'), adminController.createTrafficAccount);
router.patch('/users/:id/status', ...idParam('id', 'المستخدم'), requirePermission(PERMISSIONS.MANAGE_USERS), suspendUserRules, validate, adminController.suspendUser);
router.get('/users/:id/wallet', ...idParam('id', 'المستخدم'), requirePermission(PERMISSIONS.MANAGE_USERS), adminController.getUserWallet);
router.post('/users/:id/wallet/credit', ...idParam('id', 'المستخدم'), requirePermission(PERMISSIONS.MANAGE_USERS), walletCreditRules, validate, audit('admin.user.wallet.credit'), adminController.creditUserWallet);

// Platform settings
router.get('/settings/privacy', requirePermission(PERMISSIONS.ACCESS_ADMIN_PORTAL), adminController.getPrivacy);
router.put('/settings/privacy', requirePermission(PERMISSIONS.ACCESS_ADMIN_PORTAL), updatePrivacyRules, validate, audit('admin.settings.privacy'), adminController.updatePrivacy);
router.get('/settings/registration', requirePermission(PERMISSIONS.ACCESS_ADMIN_PORTAL), adminController.getRegistrationSettings);
router.put('/settings/registration', requirePermission(PERMISSIONS.ACCESS_ADMIN_PORTAL), updateRegistrationRules, validate, audit('admin.settings.registration'), adminController.updateRegistrationSettings);

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

// Manual payment confirmation (platform-wide)
router.post('/enrollments/:id/payment/confirm', ...idParam('id', 'طلب الاشتراك'), confirmPaymentRules, validate, audit('admin.enrollment.payment.confirm'), adminController.confirmEnrollmentPayment);

module.exports = router;
