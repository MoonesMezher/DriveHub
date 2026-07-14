const { Router } = require('express');

const router = Router();

// ── عام ──
router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/licenses', require('./licenses.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/ads', require('./ads.routes'));
router.use('/media', require('./media.routes'));
router.use('/faq', require('./faq.routes'));
router.use('/requirements', require('./requirements.routes'));
router.use('/testimonials', require('./testimonials.routes'));
router.use('/verify', require('./verify.routes'));
router.use('/content', require('./content.routes'));
router.use('/schools', require('./schools.routes'));
router.use('/reviews', require('./reviews.routes'));

// ── مستخدم مسجّل ──
router.use('/profile', require('./profile.routes'));
router.use('/location', require('./location.routes'));
router.use('/enrollments', require('./enrollments.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/search', require('./search.routes'));
router.use('/rosters', require('./rosters.routes'));
router.use('/documents', require('./documents.routes'));
router.use('/pre-registrations', require('./preRegistrations.routes'));
router.use('/school-applications', require('./schoolApplications.routes'));

// ── بوابات الأدوار ──
router.use('/student', require('./student.routes'));
router.use('/coach', require('./coach.routes'));
router.use('/manager', require('./manager.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/traffic', require('./traffic.routes'));

module.exports = router;
