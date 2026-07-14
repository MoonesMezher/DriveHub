const { Router } = require('express');
const coachController = require('../../controllers/coach.controller');
const {
    completeLessonRules,
    coachNoteRules,
} = require('../../validators/lesson.validator');
const {
    questionEditRequestRules,
    trainingDataEditRules,
    coachContentListRules,
} = require('../../validators/content.validator');
const { paginationQuery } = require('../../validators/common.validator');
const {
    auth, validate, idParam, attachPagination, schoolScope, requirePermission,
} = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.use(auth, requirePermission(PERMISSIONS.ACCESS_COACH_PORTAL), schoolScope);

router.get('/schedule', attachPagination, paginationQuery, validate, coachController.schedule);
router.get('/students', requirePermission(PERMISSIONS.MANAGE_COACH_STUDENTS), coachController.students);
router.patch('/lessons/:id/complete', ...idParam('id', 'الدرس'), requirePermission(PERMISSIONS.RATE_LESSONS), completeLessonRules, validate, coachController.completeLesson);
router.post('/notes', requirePermission(PERMISSIONS.RATE_LESSONS), coachNoteRules, validate, coachController.addNote);
router.get('/notes', coachController.listNotes);
router.get('/question-banks', requirePermission(PERMISSIONS.EDIT_TRAINING_CONTENT), coachController.listQuestionBanks);
router.get('/content', requirePermission(PERMISSIONS.EDIT_TRAINING_CONTENT), coachContentListRules, validate, coachController.listContent);
router.post('/edits/questions', requirePermission(PERMISSIONS.EDIT_TRAINING_CONTENT), questionEditRequestRules, validate, coachController.requestQuestionEdit);
router.post('/edits/content', requirePermission(PERMISSIONS.EDIT_TRAINING_CONTENT), trainingDataEditRules, validate, coachController.requestContentEdit);

module.exports = router;
