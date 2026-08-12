const { makeHandler } = require('../utils/controllerFactory');
const { studentService, contentService, examService, lessonService } = require('../services');

module.exports = {
    dashboard: makeHandler(
        (req) => studentService.getDashboard(req._user.userId),
        { wrap: (d) => ({ dashboard: d }) },
    ),
    archive: makeHandler(
        (req) => studentService.getArchive(req._user.userId),
        { wrap: (d) => ({ archive: d }) },
    ),
    statistics: makeHandler(
        (req) => studentService.getStatistics(req._user.userId),
        { wrap: (d) => ({ statistics: d }) },
    ),
    listTheory: makeHandler(
        (req) => contentService.listTheory(req.query, req._user.userId),
        { wrap: (d) => ({ items: d }) },
    ),
    getTheory: makeHandler(
        (req) => contentService.getTheoryById(req.params.id, req._user.userId),
        { wrap: (d) => ({ content: d }) },
    ),
    listShared: makeHandler((req) => contentService.listShared(req.query), { wrap: (d) => ({ items: d }) }),
    listSpecific: makeHandler((req) => contentService.listSpecific(req.query), { wrap: (d) => ({ items: d }) }),
    listVideos: makeHandler(
        (req) => contentService.listVideos(req.query, req._user.userId),
        { wrap: (d) => ({ items: d }) },
    ),
    completeTheory: makeHandler(
        (req) => contentService.completeTheoryContent(req._user.userId, req.params.id),
        { wrap: (d) => d },
    ),
    getUnlockMode: makeHandler((req) => contentService.getUnlockMode(req._user.userId, req.query)),
    setUnlockMode: makeHandler((req) => contentService.setUnlockMode(req._user.userId, req.body), { status: 201 }),
    startPractice: makeHandler((req) => examService.startPractice(req._user.userId, req.body), { status: 201 }),
    submitPractice: makeHandler(
        (req) => examService.submitPractice(req._user.userId, req.body),
        { wrap: (d) => d },
    ),
    listPractice: makeHandler((req) => examService.listPracticeHistory(req._user.userId, req.query), { wrap: (d) => ({ exams: d }) }),
    getExamInfo: makeHandler((req) => examService.getExamInfo(req._user.userId), { wrap: (d) => ({ exam: d }) }),
    listCertificates: makeHandler((req) => examService.listCertificates(req._user.userId), { wrap: (d) => ({ certificates: d }) }),
    bookLesson: makeHandler((req) => lessonService.book(req._user.userId, req.body), { status: 201 }),
    autoBookLesson: makeHandler((req) => lessonService.autoBookNextLesson(req._user.userId, req.body), { status: 201, wrap: (d) => ({ lesson: d }) }),
    listEligibleCoaches: makeHandler(
        (req) => lessonService.listEligibleCoaches(req._user.userId, req.query.enrollmentId, req.query),
        { wrap: (d) => ({ coaches: d }) },
    ),
    listAvailableCoaches: makeHandler(
        (req) => lessonService.listAvailableCoaches(req._user.userId, req.query),
        { wrap: (d) => d },
    ),
    listLessons: makeHandler((req) => lessonService.listStudentLessons(req._user.userId, req.query), { wrap: (d) => ({ lessons: d }) }),
    cancelLesson: makeHandler(
        (req) => lessonService.cancelByStudent(req._user.userId, req.params.id),
        { wrap: (d) => ({ lesson: d }) },
    ),
};
