const { makeHandler } = require('../utils/controllerFactory');
const { lessonService, contentService } = require('../services');

module.exports = {
    schedule: makeHandler((req) => lessonService.listCoachSchedule(req._user.userId, req.query), { wrap: (d) => ({ schedule: d }) }),
    students: makeHandler((req) => lessonService.listCoachStudents(req._user.userId, req.query), { wrap: (d) => ({ students: d }) }),
    completeLesson: makeHandler((req) => lessonService.complete(req.params.id, req._user.userId, req.body)),
    cancelLesson: makeHandler(
        (req) => lessonService.cancelByCoach(req._user.userId, req.params.id),
        { wrap: (d) => ({ lesson: d }) },
    ),
    postponeLesson: makeHandler(
        (req) => lessonService.postponeByCoach(req._user.userId, req.params.id, req.body),
        { wrap: (d) => ({ lesson: d }) },
    ),
    confirmLesson: makeHandler(
        (req) => lessonService.confirmByCoach(req._user.userId, req.params.id),
        { wrap: (d) => ({ lesson: d }) },
    ),
    addNote: makeHandler((req) => lessonService.addCoachNote(req._user.userId, req.body), { status: 201 }),
    listNotes: makeHandler((req) => lessonService.listCoachNotes(req._user.userId, req.query), { wrap: (d) => ({ notes: d }) }),
    listQuestionBanks: makeHandler(
        (req) => contentService.listCoachQuestionBanks(req._user.userId),
        { wrap: (d) => ({ banks: d }) },
    ),
    listContent: makeHandler(
        (req) => contentService.listCoachContent(req.query.contentType),
        { wrap: (d) => ({ items: d }) },
    ),
    requestQuestionEdit: makeHandler((req) => contentService.requestQuestionEdit(req._user.userId, req.body), { status: 201 }),
    requestContentEdit: makeHandler((req) => contentService.requestContentEdit(req._user.userId, req.body), { status: 201 }),
};
