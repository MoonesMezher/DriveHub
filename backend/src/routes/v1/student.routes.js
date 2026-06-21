const { Router } = require('express');
const studentController = require('../../controllers/student.controller');
const {
    startPracticeExamRules,
    submitPracticeExamRules,
} = require('../../validators/exam.validator');
const { bookLessonRules, autoBookLessonRules } = require('../../validators/lesson.validator');
const { contentUnlockRules } = require('../../validators/content.validator');
const { paginationQuery } = require('../../validators/common.validator');
const {
    auth, validate, idParam, attachPagination, requirePermission,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth, requirePermission(PERMISSIONS.ACCESS_STUDENT_PORTAL));

router.get('/dashboard', studentController.dashboard);
router.get('/archive', requirePermission(PERMISSIONS.VIEW_ARCHIVE), studentController.archive);
router.get('/statistics', studentController.statistics);

router.get('/content/theory', attachPagination, paginationQuery, validate, requirePermission(PERMISSIONS.LEARN_CONTENT), studentController.listTheory);
router.get('/content/theory/:id', ...idParam('id', 'المحتوى'), requirePermission(PERMISSIONS.LEARN_CONTENT), studentController.getTheory);
router.get('/content/shared', requirePermission(PERMISSIONS.LEARN_CONTENT), studentController.listShared);
router.get('/content/specific', requirePermission(PERMISSIONS.LEARN_CONTENT), studentController.listSpecific);
router.get('/content/videos', requirePermission(PERMISSIONS.LEARN_CONTENT), studentController.listVideos);
router.get('/content/unlock', requirePermission(PERMISSIONS.LEARN_CONTENT), studentController.getUnlockMode);
router.post('/content/unlock', requirePermission(PERMISSIONS.LEARN_CONTENT), contentUnlockRules, validate, studentController.setUnlockMode);

router.post('/practice/start', requirePermission(PERMISSIONS.TAKE_PRACTICE_EXAM), startPracticeExamRules, validate, studentController.startPractice);
router.post('/practice/submit', requirePermission(PERMISSIONS.TAKE_PRACTICE_EXAM), submitPracticeExamRules, validate, studentController.submitPractice);
router.get('/practice', requirePermission(PERMISSIONS.TAKE_PRACTICE_EXAM), studentController.listPractice);

router.get('/exam-info', requirePermission(PERMISSIONS.VIEW_EXAM_INFO), studentController.getExamInfo);
router.get('/certificates', requirePermission(PERMISSIONS.VIEW_CERTIFICATES), studentController.listCertificates);

router.post('/lessons', requirePermission(PERMISSIONS.BOOK_LESSONS), bookLessonRules, validate, studentController.bookLesson);
router.post('/lessons/auto-book', requirePermission(PERMISSIONS.BOOK_LESSONS), autoBookLessonRules, validate, studentController.autoBookLesson);
router.get('/lessons/eligible-coaches', requirePermission(PERMISSIONS.BOOK_LESSONS), studentController.listEligibleCoaches);
router.get('/lessons', requirePermission(PERMISSIONS.BOOK_LESSONS), studentController.listLessons);

module.exports = router;
