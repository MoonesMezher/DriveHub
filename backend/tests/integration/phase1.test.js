const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const {
    User,
    UserRole,
    RefreshToken,
    DrivingSchool,
    TrainingCourse,
    PlatformPricing,
    Enrollment,
    Notification,
    LicenseCategory,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');
const { COURSE_STATUS } = require('../../src/constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');
const { paymentDeadlineFromNow } = require('../../src/utils/dateUtils');
const enrollmentService = require('../../src/services/enrollment.service');

let mongoServer;
let app;
let accessToken;
let schoolId;
let courseId;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const user = await User.create({
        name: 'Phase1 User',
        email: 'phase1@drivehub.local',
        phone: '0944000001',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.REGISTERED },
    });
    await UserRole.create({ userId: user._id, role: ROLES.REGISTERED });

    await User.findByIdAndUpdate(user._id, {
        profileData: { dateOfBirth: '2000-01-01' },
    });

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'phase1@drivehub.local',
        password: strongPassword,
    });
    accessToken = login.body.data.accessToken;

    const school = await DrivingSchool.create({
        name: 'مدرسة اختبار',
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
        maxStudents: 60,
        paidCount: 0,
        registrationOpen: true,
        status: COURSE_STATUS.REGISTRATION_OPEN,
    });
    courseId = course._id;

    await PlatformPricing.create({
        categoryCode: 'B',
        fixedPrice: 500000,
        isActive: true,
    });

    await LicenseCategory.create({ code: 'B', name: 'خصوصي', minAge: 18, order: 1 });
});

afterEach(async () => {
    await Promise.all([
        Enrollment.deleteMany({}),
        Notification.deleteMany({}),
    ]);
});

afterAll(async () => {
    await Promise.all([
        User.deleteMany({}),
        UserRole.deleteMany({}),
        RefreshToken.deleteMany({}),
        DrivingSchool.deleteMany({}),
        TrainingCourse.deleteMany({}),
        PlatformPricing.deleteMany({}),
        LicenseCategory.deleteMany({}),
    ]);
    await mongoose.disconnect();
    await mongoServer.stop();
});

const auth = (req) => req.set('Authorization', `Bearer ${accessToken}`);

describe('Phase 1 APIs', () => {
    it('GET /profile returns user profile', async () => {
        const res = await auth(request(app).get('/api/v1/profile'));
        expect(res.status).toBe(200);
        expect(res.body.data.profile.email).toBe('phase1@drivehub.local');
    });

    it('PATCH /profile updates name', async () => {
        const res = await auth(
            request(app).patch('/api/v1/profile').send({ name: 'مستخدم محدّث' }),
        );
        expect(res.status).toBe(200);
        expect(res.body.data.profile.name).toBe('مستخدم محدّث');
    });

    it('POST /location saves coordinates', async () => {
        const res = await auth(
            request(app).post('/api/v1/location').send({ lat: 33.51, lng: 36.27 }),
        );
        expect(res.status).toBe(200);
        expect(res.body.data.location.lat).toBe(33.51);
    });

    it('POST /enrollments creates enrollment request', async () => {
        const res = await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
                subTypeCode: 'B1',
            }),
        );
        expect(res.status).toBe(201);
        expect(res.body.data.enrollment.status).toBe(ENROLLMENT_STATUS.SUBMITTED);
    });

    it('POST /enrollments rejects duplicate pending', async () => {
        await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
            }),
        );
        const res = await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
            }),
        );
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/طلب اشتراك معلّق/);
    });

    it('payment flow: initiate and confirm', async () => {
        const createRes = await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
            }),
        );
        const enrollmentId = createRes.body.data.enrollment._id;

        const enrollment = await Enrollment.findById(enrollmentId);
        enrollment.status = ENROLLMENT_STATUS.AWAITING_PAYMENT;
        enrollment.paymentDeadline = paymentDeadlineFromNow(3);
        await enrollment.save();

        const initRes = await auth(
            request(app).post(`/api/v1/enrollments/${enrollmentId}/payment/initiate`),
        );
        expect(initRes.status).toBe(200);
        expect(initRes.body.data.payment.amount).toBe(500000);

        const confirmRes = await auth(
            request(app).post(`/api/v1/enrollments/${enrollmentId}/payment/confirm`).send({
                amount: 500000,
            }),
        );
        expect(confirmRes.status).toBe(200);
        expect(confirmRes.body.data.enrollment.status).toBe(ENROLLMENT_STATUS.PAID);
    });

    it('GET /notifications lists user notifications', async () => {
        await Notification.create({
            userId: (await User.findOne({ email: 'phase1@drivehub.local' }))._id,
            type: 'general',
            title: 'اختبار',
            message: 'رسالة اختبار',
        });

        const res = await auth(request(app).get('/api/v1/notifications'));
        expect(res.status).toBe(200);
        expect(res.body.data.notifications.length).toBeGreaterThan(0);
    });

    it('expireAwaitingPayment job expires overdue enrollments', async () => {
        const user = await User.findOne({ email: 'phase1@drivehub.local' });
        const enrollment = await Enrollment.create({
            userId: user._id,
            courseId,
            schoolId,
            categoryCode: 'B',
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: new Date(Date.now() - 1000),
        });

        const count = await enrollmentService.expireAwaitingPayment();
        expect(count).toBeGreaterThan(0);

        const updated = await Enrollment.findById(enrollment._id);
        expect(updated.status).toBe(ENROLLMENT_STATUS.EXPIRED);
    });
});
