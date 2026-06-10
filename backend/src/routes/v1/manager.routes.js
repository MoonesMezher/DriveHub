const { Router } = require('express');
const managerController = require('../../controllers/manager.controller');
const {
    createCourseRules,
    launchCourseRules,
    updateCourseRules,
} = require('../../validators/course.validator');
const { acceptEnrollmentRules, rejectEnrollmentRules } = require('../../validators/enrollment.validator');
const {
    assignInstructorRules,
    updateInstructorRules,
} = require('../../validators/instructor.validator');
const {
    createQuestionBankRules,
    createQuestionRules,
    reviewEditRequestRules,
} = require('../../validators/content.validator');
const {
    createRosterRules,
    submitRosterRules,
} = require('../../validators/roster.validator');
const { finalExamResultRules } = require('../../validators/exam.validator');
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
router.patch('/courses/:id/close', ...idParam('id', 'الدورة'), requirePermission(PERMISSIONS.MANAGE_COURSES), managerController.closeCourse);
router.post('/courses/:id/launch', ...idParam('id', 'الدورة'), requirePermission(PERMISSIONS.MANAGE_COURSES), launchCourseRules, validate, audit('manager.course.launch'), managerController.launchCourse);

// Enrollments
router.get('/courses/:courseId/enrollments', mongoIdParam('courseId', 'الدورة'), validate, requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), managerController.enrollmentQueue);
router.post('/enrollments/:id/accept', ...idParam('id', 'طلب الاشتراك'), requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), acceptEnrollmentRules, validate, audit('manager.enrollment.accept'), managerController.acceptEnrollment);
router.post('/enrollments/:id/reject', ...idParam('id', 'طلب الاشتراك'), requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), rejectEnrollmentRules, validate, audit('manager.enrollment.reject'), managerController.rejectEnrollment);

// Instructors
router.get('/instructors', requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), managerController.listInstructors);
router.post('/instructors', requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), assignInstructorRules, validate, managerController.assignInstructor);
router.patch('/instructors/:id', ...idParam('id', 'المدرب'), requirePermission(PERMISSIONS.MANAGE_INSTRUCTORS), updateInstructorRules, validate, managerController.updateInstructor);

// Question bank
router.post('/question-banks', requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK), createQuestionBankRules, validate, managerController.createQuestionBank);
router.post('/question-banks/:bankId/questions', mongoIdParam('bankId', 'بنك الأسئلة'), validate, requirePermission(PERMISSIONS.MANAGE_QUESTION_BANK), createQuestionRules, validate, managerController.addQuestion);

// Content edit approvals
router.get('/content-edits/pending', requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS), managerController.listPendingEdits);
router.post('/content-edits/:id/review', ...idParam('id', 'طلب التعديل'), requirePermission(PERMISSIONS.APPROVE_CONTENT_EDITS), reviewEditRequestRules, validate, managerController.reviewEdit);

// Roster
router.post('/rosters', requirePermission(PERMISSIONS.SUBMIT_ROSTER), createRosterRules, validate, audit('manager.roster.create'), managerController.createRoster);
router.post('/rosters/:id/submit', ...idParam('id', 'القائمة'), requirePermission(PERMISSIONS.SUBMIT_ROSTER), submitRosterRules, validate, audit('manager.roster.submit'), managerController.submitRoster);

// Final exam results (internal record)
router.post('/exam-results', requirePermission(PERMISSIONS.REVIEW_ENROLLMENTS), finalExamResultRules, validate, managerController.recordFinalResult);

module.exports = router;
