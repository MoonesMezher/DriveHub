const { makeHandler } = require('../utils/controllerFactory');
const { lessonService, contentService } = require('../services');

module.exports = {
    schedule: makeHandler((req) => lessonService.listCoachSchedule(req._user.userId, req.query), { wrap: (d) => ({ schedule: d }) }),
    students: makeHandler((req) => lessonService.listCoachStudents(req._user.userId, req.query), { wrap: (d) => ({ students: d }) }),
    completeLesson: makeHandler((req) => lessonService.complete(req.params.id, req._user.userId, req.body)),
    addNote: makeHandler((req) => lessonService.addCoachNote(req._user.userId, req.body), { status: 201 }),
    listNotes: makeHandler((req) => lessonService.listCoachNotes(req._user.userId, req.query), { wrap: (d) => ({ notes: d }) }),
    requestQuestionEdit: makeHandler((req) => contentService.requestQuestionEdit(req._user.userId, req.body), { status: 201 }),
    requestContentEdit: makeHandler((req) => contentService.requestContentEdit(req._user.userId, req.body), { status: 201 }),
};
