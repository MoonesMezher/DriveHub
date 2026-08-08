const { makeHandler } = require('../utils/controllerFactory');
const {
    courseService,
    enrollmentService,
    instructorService,
    contentService,
    rosterService,
    lessonService,
    paymentService,
} = require('../services');

module.exports = {
    listCourses: makeHandler((req) => courseService.listBySchool(req.schoolScope, req.query.category), { wrap: (d) => ({ courses: d }) }),
    getCourse: makeHandler(
        (req) => courseService.getById(req.params.id, req.schoolScope),
        { wrap: (d) => ({ course: d }) },
    ),
    createCourse: makeHandler((req) => courseService.create({ ...req.body, schoolId: req.schoolScope }), { status: 201, wrap: (d) => ({ course: d }) }),
    closeCourse: makeHandler(
        (req) => courseService.closeRegistration(req.params.id, req.schoolScope),
        { wrap: (d) => ({ course: d }) },
    ),
    launchCourse: makeHandler(
        (req) => courseService.launch(req.params.id, req.body.previousLaunchDate, req.schoolScope),
        { wrap: (d) => ({ course: d }) },
    ),
    enrollmentQueue: makeHandler((req) => enrollmentService.getManagerQueue(req.params.courseId), { wrap: (d) => ({ queue: d }) }),
    awaitingPaymentQueue: makeHandler(
        (req) => enrollmentService.getManagerPaymentQueue(req.params.courseId, req.schoolScope),
        { wrap: (d) => ({ queue: d }) },
    ),
    confirmEnrollmentPayment: makeHandler(
        (req) => paymentService.confirmByStaff({
            enrollmentId: req.params.id,
            confirmedByUserId: req._user.userId,
            schoolScope: req.schoolScope,
            amount: req.body.amount,
            gatewayRef: req.body.gatewayRef,
        }),
        { wrap: (d) => d, message: 'تم تأكيد الدفع اليدوي بنجاح' },
    ),
    rosterCandidates: makeHandler((req) => enrollmentService.listRosterCandidates(req.params.courseId, req.schoolScope), { wrap: (d) => ({ candidates: d }) }),
    acceptEnrollment: makeHandler((req) => enrollmentService.accept(req.params.id, req.body.paymentDeadlineDays), { wrap: (d) => ({ enrollment: d }) }),
    rejectEnrollment: makeHandler((req) => enrollmentService.reject(req.params.id, req.body.rejectionReason), { wrap: (d) => ({ enrollment: d }) }),
    listInstructors: makeHandler((req) => instructorService.list(req.schoolScope, req.query), { wrap: (d) => ({ instructors: d }) }),
    getInstructor: makeHandler(
        (req) => instructorService.getById(req.params.id, req.schoolScope),
        { wrap: (d) => ({ instructor: d }) },
    ),
    assignInstructor: makeHandler((req) => instructorService.assign({ ...req.body, schoolId: req.schoolScope }), { status: 201 }),
    updateInstructor: makeHandler(
        (req) => instructorService.update(req.params.id, req.body, req.schoolScope),
        { wrap: (d) => ({ instructor: d }) },
    ),
    listQuestionBanks: makeHandler((req) => contentService.listQuestionBanks(req.schoolScope, req.query), { wrap: (d) => ({ banks: d }) }),
    getQuestionBank: makeHandler(
        (req) => contentService.getQuestionBankById(req.params.bankId, req.schoolScope),
        { wrap: (d) => ({ bank: d }) },
    ),
    createQuestionBank: makeHandler((req) => contentService.createQuestionBank(req._user.userId, { ...req.body, schoolId: req.schoolScope }), { status: 201 }),
    addQuestion: makeHandler((req) => contentService.addQuestion(req.params.bankId, req.body), { status: 201, wrap: (d) => ({ question: d }) }),
    getQuestion: makeHandler(
        (req) => contentService.getQuestionById(req.params.bankId, req.params.questionId, req.schoolScope),
        { wrap: (d) => d },
    ),
    updateQuestion: makeHandler(
        (req) => contentService.updateQuestion(req.params.bankId, req.params.questionId, req.body, req.schoolScope),
        { wrap: (d) => ({ question: d }) },
    ),
    listTheoryContent: makeHandler((req) => contentService.listTheory(req.query), { wrap: (d) => ({ items: d }) }),
    getTheoryContent: makeHandler(
        (req) => contentService.getTheoryForManager(req.params.id),
        { wrap: (d) => ({ item: d }) },
    ),
    createTheoryContent: makeHandler((req) => contentService.createTheory(req.body, req._user.userId), { status: 201, wrap: (d) => ({ item: d }) }),
    listPendingEdits: makeHandler((req) => contentService.listPendingEdits(req.schoolScope), { wrap: (d) => ({ edits: d }) }),
    reviewEdit: makeHandler((req) => contentService.reviewEditRequest(req.params.id, req._user.userId, req.body)),
    createRoster: makeHandler((req) => rosterService.create({ ...req.body, schoolId: req.schoolScope, submittedBy: req._user.userId }), { status: 201 }),
    listRosters: makeHandler((req) => rosterService.listBySchool(req.schoolScope, req.query), { wrap: (d) => ({ rosters: d }) }),
    submitRoster: makeHandler((req) => rosterService.submit(req.params.id, req._user.userId)),
    schoolSchedule: makeHandler(
        (req) => lessonService.listSchoolSchedule(req.schoolScope, req.query),
        { wrap: (d) => ({ lessons: d }) },
    ),
};
