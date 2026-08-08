const { Router } = require('express');
const managerController = require('../../controllers/manager.controller');
const {
    createCourseRules,
    launchCourseRules,
    updateCourseRules,
} = require('../../validators/course.validator');
const { acceptEnrollmentRules, rejectEnrollmentRules } = require('../../validators/enrollment.validator');
const { confirmPaymentRules } = require('../../validators/payment.validator');
const {
    assignInstructorRules,
    updateInstructorRules,
} = require('../../validators/instructor.validator');
const {
    createQuestionBankRules,
    createQuestionRules,
    updateQuestionRules,
    createTheoryContentRules,
    reviewEditRequestRules,
} = require('../../validators/content.validator');
const {
    createRosterRules,
    submitRosterRules,
} = require('../../validators/roster.validator');
const { paginationQuery } = require('../../validators/common.validator');
const {
    auth, validate, idParam, mongoIdParam, attachPagination, schoolScope, requirePermission, audit,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth, requirePermission(PERMISSIONS.ACCESS_MANAGER_PORTAL), schoolScope);

// Courses
router.get('/courses', attachPagination, paginationQuery, validate, requirePermission(PERMISSIONS.MANAGE_COURSES), managerController.listCourses);
router.post('/courses', requirePermission(PERMISSIONS.MANAGE_COURSES), createCourseRules, validate, audit('manager.course.create'), managerController.createCourse);
router.get('/courses/:id', ...idParam('id', 'الدورة'), requirePermission(PERMISSIONS.MANAGE_COURSES), managerController.getCourse);
router.patch('/courses/:id/close', ...idParam('id', 'الدورة'), requirePermission(PERMISSIONS.MANAGE_COURSES), managerController.closeCourse);
router.post('/courses/:id/launch', ...idParam('id', 'الدورة'), requirePermission(PERMISSIONS.MANAGE_COURSES), launchCourseRules, validate, audit('manager.course.launch'), managerController.launchCourse);

// Enrollments
router.get('/courses/:courseId/enrollments', mongoIdParam('courseId', 'الدورة'), validate, requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), managerController.enrollmentQueue);
router.get('/courses/:courseId/enrollments/awaiting-payment', mongoIdParam('courseId', 'الدورة'), validate, requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), managerController.awaitingPaymentQueue);
router.get('/courses/:courseId/roster-candidates', mongoIdParam('courseId', 'الدورة'), validate, requirePermission(PERMISSIONS.SUBMIT_ROSTER), managerController.rosterCandidates);
router.post('/enrollments/:id/accept', ...idParam('id', 'طلب الاشتراك'), requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), acceptEnrollmentRules, validate, audit('manager.enrollment.accept'), managerController.acceptEnrollment);
router.post('/enrollments/:id/reject', ...idParam('id', 'طلب الاشتراك'), requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), rejectEnrollmentRules, validate, audit('manager.enrollment.reject'), managerController.rejectEnrollment);
router.post('/enrollments/:id/payment/confirm', ...idParam('id', 'طلب الاشتراك'), requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), confirmPaymentRules, validate, audit('manager.enrollment.payment.confirm'), managerController.confirmEnrollmentPayment);

// Instructors
router.get('/instructors', requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), managerController.listInstructors);
router.get('/instructors/:id', ...idParam('id', 'المدرب'), requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), managerController.getInstructor);
router.post('/instructors', requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), assignInstructorRules, validate, managerController.assignInstructor);
router.patch('/instructors/:id', ...idParam('id', 'المدرب'), requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), updateInstructorRules, validate, managerController.updateInstructor);

// Question bank
router.get('/question-banks', requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK), managerController.listQuestionBanks);
router.get(
    '/question-banks/:bankId',
    requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK),
    managerController.getQuestionBank,
);
router.post('/question-banks', requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK), createQuestionBankRules, validate, managerController.createQuestionBank);
router.post('/question-banks/:bankId/questions', mongoIdParam('bankId', 'بنك الأسئلة'), validate, requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK), createQuestionRules, validate, managerController.addQuestion);
router.get(
    '/question-banks/:bankId/questions/:questionId',
    mongoIdParam('questionId', 'السؤال'),
    validate,
    requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK),
    managerController.getQuestion,
);
router.patch(
    '/question-banks/:bankId/questions/:questionId',
    mongoIdParam('bankId', 'بنك الأسئلة'),
    mongoIdParam('questionId', 'السؤال'),
    validate,
    requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK),
    updateQuestionRules,
    validate,
    managerController.updateQuestion,
);

// Theory content (MVP editor)
router.get('/content/theory', requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS), managerController.listTheoryContent);
router.get(
    '/content/theory/:id',
    ...idParam('id', 'المحتوى النظري'),
    requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS),
    managerController.getTheoryContent,
);
router.post('/content/theory', requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS), createTheoryContentRules, validate, audit('manager.content.theory.create'), managerController.createTheoryContent);

// Content edit approvals
router.get('/content-edits/pending', requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS), managerController.listPendingEdits);
router.post('/content-edits/:id/review', ...idParam('id', 'طلب التعديل'), requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS), reviewEditRequestRules, validate, managerController.reviewEdit);

// Roster
router.get('/rosters', requirePermission(PERMISSIONS.SUBMIT_ROSTER), managerController.listRosters);
router.post('/rosters', requirePermission(PERMISSIONS.SUBMIT_ROSTER), createRosterRules, validate, audit('manager.roster.create'), managerController.createRoster);
router.post('/rosters/:id/submit', ...idParam('id', 'القائمة'), requirePermission(PERMISSIONS.SUBMIT_ROSTER), submitRosterRules, validate, audit('manager.roster.submit'), managerController.submitRoster);

// Schedule
router.get('/schedule', requirePermission(PERMISSIONS.MANAGE_COURSES), managerController.schoolSchedule);

module.exports = router;
