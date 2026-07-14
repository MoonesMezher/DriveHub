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
    Payment,
    DocumentUpload,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { encrypt } = require('../../src/utils/encryption');
const { ROLES } = require('../../src/constants/roles');
const { COURSE_STATUS } = require('../../src/constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');
const { paymentDeadlineFromNow } = require('../../src/utils/dateUtils');
const enrollmentService = require('../../src/services/enrollment.service');
const walletService = require('../../src/services/wallet.service');

let mongoServer;
let app;
let accessToken;
let schoolId;
let courseId;
let userId;

const strongPassword = 'SecurePass1!';

const TEST_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

const seedEncryptedDoc = (uid, type, name) => DocumentUpload.create({
    userId: uid,
    type,
    encryptedPath: encrypt(TEST_PNG.toString('base64')),
    mime: 'image/png',
    originalName: name,
    size: TEST_PNG.length,
});

const seedRequiredDocuments = async (uid) => {
    await seedEncryptedDoc(uid, 'national_id', 'id.png');
    await seedEncryptedDoc(uid, 'medical_report', 'medical.png');
};

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
    userId = user._id;

    await User.findByIdAndUpdate(user._id, {
        profileData: { dateOfBirth: '2000-01-01' },
    });

    await seedRequiredDocuments(user._id);

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
        Payment.deleteMany({}),
        DocumentUpload.deleteMany({ userId: { $ne: userId } }),
    ]);
    await seedRequiredDocuments(userId);
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
        DocumentUpload.deleteMany({}),
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
        expect(res.body.data.enrollment.status).toBe(ENROLLMENT_STATUS.UNDER_REVIEW);
    });

    it('POST /enrollments rejects when required documents are missing', async () => {
        await DocumentUpload.deleteMany({ userId });

        const res = await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
                subTypeCode: 'B1',
            }),
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/الهوية|التوثيق الطبي|المستندات/);
    });

    it('POST /enrollments rejects when only national_id is uploaded', async () => {
        await DocumentUpload.deleteMany({ userId });
        await seedEncryptedDoc(userId, 'national_id', 'id.png');

        const res = await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
                subTypeCode: 'B1',
            }),
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/التوثيق الطبي/);
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

    it('payment flow: initiate and pay from wallet', async () => {
        const admin = await User.create({
            name: 'Phase1 Admin',
            email: 'phase1-admin@drivehub.local',
            phone: '0944000099',
            password: await passwordService.hashPassword(strongPassword),
            activeContext: { role: ROLES.ADMIN },
        });
        await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

        await walletService.creditUser({
            userId,
            amount: 500000,
            adminId: admin._id,
            note: 'TEST-CREDIT',
        });

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
        expect(initRes.body.data.walletBalance).toBe(500000);

        const payRes = await auth(
            request(app).post(`/api/v1/enrollments/${enrollmentId}/pay-from-wallet`),
        );
        expect(payRes.status).toBe(200);
        expect(payRes.body.data.enrollment.status).toBe(ENROLLMENT_STATUS.PAID);
        expect(payRes.body.data.walletBalance).toBe(0);
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
