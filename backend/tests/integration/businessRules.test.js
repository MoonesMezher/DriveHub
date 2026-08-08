const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const {
    User,
    UserRole,
    DrivingSchool,
    TrainingCourse,
    PlatformPricing,
    Enrollment,
    LicenseCategory,
    Payment,
    ContentUnlockMode,
    PreRegistration,
    Notification,
    DocumentUpload,
} = require('../../src/models');
const { encrypt } = require('../../src/utils/encryption');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');
const { COURSE_STATUS } = require('../../src/constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');
const courseService = require('../../src/services/course.service');
const rosterService = require('../../src/services/roster.service');
const enrollmentService = require('../../src/services/enrollment.service');
const paymentService = require('../../src/services/payment.service');
const examService = require('../../src/services/exam.service');
const { splitPayment } = require('../../src/helpers/payment.helper');
const { addDays } = require('../../src/utils/dateUtils');

let mongoServer;
let app;
let userId;
let token;
let schoolId;
let courseId;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    await LicenseCategory.create({ code: 'B', name: 'خصوصي', minAge: 18, order: 1 });

    const user = await User.create({
        name: 'Rules User',
        email: 'rules@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        profileData: { dateOfBirth: '2000-01-01' },
        activeContext: { role: ROLES.REGISTERED },
    });
    userId = user._id;
    await UserRole.create({ userId, role: ROLES.REGISTERED });
    await DocumentUpload.create([
        {
            userId,
            type: 'national_id',
            encryptedPath: encrypt('id-doc'),
            mime: 'image/png',
            originalName: 'id.png',
            size: 10,
        },
        {
            userId,
            type: 'medical_report',
            encryptedPath: encrypt('medical-doc'),
            mime: 'image/png',
            originalName: 'medical.png',
            size: 10,
        },
    ]);

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'rules@drivehub.local',
        password: strongPassword,
    });
    token = login.body.data.accessToken;

    const school = await DrivingSchool.create({
        name: 'مدرسة قواعد',
        address: 'دمشق',
        lat: 33.5,
        lng: 36.2,
        licenses: ['B'],
        status: 'active',
    });
    schoolId = school._id;

    const course = await TrainingCourse.create({
        schoolId,
        categoryCode: 'B',
        subTypeCode: 'B1',
        maxStudents: 10,
        registrationOpen: true,
        status: COURSE_STATUS.REGISTRATION_OPEN,
        paymentDeadlineDays: 3,
        launchAfterCloseDays: 7,
    });
    courseId = course._id;

    await PlatformPricing.create({ categoryCode: 'B', fixedPrice: 100000, isActive: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Promise.all([
        Enrollment.deleteMany({}),
        Payment.deleteMany({}),
        ContentUnlockMode.deleteMany({}),
        PreRegistration.deleteMany({}),
        Notification.deleteMany({}),
        DocumentUpload.deleteMany({ userId: { $ne: userId } }),
        TrainingCourse.deleteMany({ _id: { $ne: courseId } }),
    ]);
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('DriveHub business rules', () => {
    it('blocks launch before 15 days from previous course', async () => {
        const prev = await TrainingCourse.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            maxStudents: 10,
            status: COURSE_STATUS.REGISTRATION_CLOSED,
            registrationOpen: false,
            registrationClosedAt: addDays(new Date(), -1),
            launchDate: addDays(new Date(), -5),
            endDate: addDays(new Date(), 10),
        });

        const next = await TrainingCourse.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            maxStudents: 10,
            status: COURSE_STATUS.REGISTRATION_CLOSED,
            registrationOpen: false,
            registrationClosedAt: addDays(new Date(), -1),
        });

        await expect(
            courseService.launch(next._id, prev.launchDate),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('allows new course registration while another course is active', async () => {
        await TrainingCourse.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            maxStudents: 10,
            status: COURSE_STATUS.ACTIVE,
            registrationOpen: false,
            launchDate: addDays(new Date(), -20),
            endDate: addDays(new Date(), -5),
        });

        const open = await courseService.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B2',
            maxStudents: 10,
        });
        expect(open.status).toBe(COURSE_STATUS.REGISTRATION_OPEN);
    });

    it('blocks course create before 15 days from previous launch', async () => {
        await TrainingCourse.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            maxStudents: 10,
            status: COURSE_STATUS.ACTIVE,
            registrationOpen: false,
            launchDate: addDays(new Date(), -5),
            endDate: addDays(new Date(), 10),
        });

        await expect(
            courseService.create({
                schoolId,
                categoryCode: 'B',
                subTypeCode: 'B2',
                maxStudents: 10,
            }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('reserves seat only on payment confirm (not on accept)', async () => {
        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.UNDER_REVIEW,
            managerVisible: true,
        });

        await enrollmentService.accept(enrollment._id, 3);
        const courseAfterAccept = await TrainingCourse.findById(courseId);
        expect(courseAfterAccept.paidCount).toBe(0);

        const accepted = await Enrollment.findById(enrollment._id);
        accepted.status = ENROLLMENT_STATUS.AWAITING_PAYMENT;
        await accepted.save();

        const admin = await User.create({
            name: 'Admin',
            email: 'rules-admin@drivehub.local',
            password: await passwordService.hashPassword(strongPassword),
            activeContext: { role: ROLES.ADMIN },
        });
        await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

        await paymentService.confirmByStaff({
            enrollmentId: enrollment._id,
            confirmedByUserId: admin._id,
            amount: 100000,
        });

        const courseAfterPay = await TrainingCourse.findById(courseId);
        expect(courseAfterPay.paidCount).toBe(1);
    });

    it('creates pre-registration automatically when no capacity and enabled', async () => {
        const fullCourse = await TrainingCourse.findByIdAndUpdate(
            courseId,
            { paidCount: 10, maxStudents: 10, registrationOpen: true },
            { new: true },
        );
        expect(fullCourse.paidCount).toBe(fullCourse.maxStudents);

        await expect(
            enrollmentService.create({
                userId,
                courseId,
                schoolId,
                categoryCode: 'B',
                subTypeCode: 'B1',
            }),
        ).rejects.toMatchObject({ statusCode: 400 });

        const preReg = await PreRegistration.findOne({
            userId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: 'reserved',
        });
        expect(preReg).toBeTruthy();
    });

    it('acceptance notification tells student to wait for launch', async () => {
        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.UNDER_REVIEW,
            managerVisible: true,
        });

        await enrollmentService.accept(enrollment._id, 3);

        const acceptanceNotification = await Notification.findOne({
            userId,
            type: 'enrollment_accepted',
        }).sort({ createdAt: -1 });
        expect(acceptanceNotification?.message).toMatch(/تنتظر إشعار انطلاق الدورة/);
    });

    it('locks B subType after first selection', async () => {
        await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.COMPLETED,
        });

        const courseB2 = await TrainingCourse.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B2',
            maxStudents: 10,
            registrationOpen: true,
            status: COURSE_STATUS.REGISTRATION_OPEN,
        });

        await expect(
            enrollmentService.create({
                userId,
                courseId: courseB2._id,
                schoolId,
                categoryCode: 'B',
                subTypeCode: 'B2',
            }),
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('grants full content unlock on payment confirm', async () => {
        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: addDays(new Date(), 3),
        });

        const admin = await User.create({
            name: 'Admin2',
            email: 'rules-admin2@drivehub.local',
            password: await passwordService.hashPassword(strongPassword),
            activeContext: { role: ROLES.ADMIN },
        });

        await paymentService.confirmByStaff({
            enrollmentId: enrollment._id,
            confirmedByUserId: admin._id,
            amount: 100000,
        });

        const unlock = await ContentUnlockMode.findOne({ userId, categoryCode: 'B' });
        expect(unlock?.mode).toBe('full');
    });

    it('blocks student from setting progressive unlock mode', async () => {
        await UserRole.findOneAndUpdate(
            { userId, role: ROLES.STUDENT, schoolId },
            { userId, role: ROLES.STUDENT, schoolId, status: 'active' },
            { upsert: true },
        );
        await User.findByIdAndUpdate(userId, {
            activeContext: { role: ROLES.STUDENT, schoolId },
        });
        await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.ACTIVE,
        });

        const res = await auth(
            request(app).post('/api/v1/student/content/unlock').send({
                categoryCode: 'B',
                mode: 'progressive',
            }),
        );
        expect(res.status).toBe(403);
    });

    it('blocks roster upload before 15-day training period ends', async () => {
        const activeCourse = await TrainingCourse.create({
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            maxStudents: 10,
            status: COURSE_STATUS.ACTIVE,
            launchDate: addDays(new Date(), -5),
            endDate: addDays(new Date(), 10),
        });

        await expect(
            rosterService.create({
                courseId: activeCourse._id,
                schoolId,
                studentIds: [userId],
                submittedBy: userId,
            }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('uses 2% default platform commission', () => {
        const { platformShare, commissionRate } = splitPayment(100000);
        expect(commissionRate).toBe(0.02);
        expect(platformShare).toBe(2000);
    });

    it('allows practice retest after fail but blocks after pass', async () => {
        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.ACTIVE,
        });

        await mongoose.model('PracticeExam').create({
            userId,
            enrollmentId: enrollment._id,
            categoryCode: 'B',
            score: 40,
            passed: false,
            attempt: 1,
            completedAt: new Date(),
        });

        const failedAttempt = await examService._assertCanTakePractice(userId, 'B');
        expect(failedAttempt).toBeUndefined();

        await mongoose.model('PracticeExam').create({
            userId,
            enrollmentId: enrollment._id,
            categoryCode: 'B',
            score: 80,
            passed: true,
            attempt: 2,
            completedAt: new Date(),
        });

        await expect(
            examService._assertCanTakePractice(userId, 'B'),
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('deriveRetakeScope returns FULL for final theory fail', async () => {
        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            status: ENROLLMENT_STATUS.FINAL_FAILED_THEORY,
        });
        const scope = await enrollmentService.deriveRetakeScope(enrollment);
        expect(scope).toBe('full');
    });
});
