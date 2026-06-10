const { makeHandler } = require('../utils/controllerFactory');
const {
    courseService,
    enrollmentService,
    instructorService,
    contentService,
    rosterService,
    examService,
} = require('../services');

module.exports = {
    listCourses: makeHandler((req) => courseService.getOpenCourses(req.schoolScope, req.query.category), { wrap: (d) => ({ courses: d }) }),
    createCourse: makeHandler((req) => courseService.create({ ...req.body, schoolId: req.schoolScope }), { status: 201, wrap: (d) => ({ course: d }) }),
    closeCourse: makeHandler((req) => courseService.closeRegistration(req.params.id), { wrap: (d) => ({ course: d }) }),
    launchCourse: makeHandler((req) => courseService.launch(req.params.id, req.body.previousLaunchDate), { wrap: (d) => ({ course: d }) }),
    enrollmentQueue: makeHandler((req) => enrollmentService.getManagerQueue(req.params.courseId), { wrap: (d) => ({ queue: d }) }),
    acceptEnrollment: makeHandler((req) => enrollmentService.accept(req.params.id, req.body.paymentDeadlineDays), { wrap: (d) => ({ enrollment: d }) }),
    rejectEnrollment: makeHandler((req) => enrollmentService.reject(req.params.id, req.body.rejectionReason), { wrap: (d) => ({ enrollment: d }) }),
    listInstructors: makeHandler((req) => instructorService.list(req.schoolScope, req.query), { wrap: (d) => ({ instructors: d }) }),
    assignInstructor: makeHandler((req) => instructorService.assign({ ...req.body, schoolId: req.schoolScope }), { status: 201 }),
    updateInstructor: makeHandler((req) => instructorService.update(req.params.id, req.body)),
    createQuestionBank: makeHandler((req) => contentService.createQuestionBank(req._user.userId, { ...req.body, schoolId: req.schoolScope }), { status: 201 }),
    addQuestion: makeHandler((req) => contentService.addQuestion(req.params.bankId, req.body), { status: 201 }),
    listPendingEdits: makeHandler((req) => contentService.listPendingEdits(req.schoolScope), { wrap: (d) => ({ edits: d }) }),
    reviewEdit: makeHandler((req) => contentService.reviewEditRequest(req.params.id, req._user.userId, req.body)),
    createRoster: makeHandler((req) => rosterService.create({ ...req.body, schoolId: req.schoolScope, submittedBy: req._user.userId }), { status: 201 }),
    submitRoster: makeHandler((req) => rosterService.submit(req.params.id, req._user.userId)),
    recordFinalResult: makeHandler((req) => examService.recordFinalResult(req.body, req._user.userId), { status: 201 }),
};
