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
    DocumentUpload,
    WalletTransaction,
    Payment,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { encrypt } = require('../../src/utils/encryption');
const { ROLES } = require('../../src/constants/roles');
const { COURSE_STATUS } = require('../../src/constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');
const { paymentDeadlineFromNow } = require('../../src/utils/dateUtils');
const walletService = require('../../src/services/wallet.service');

let mongoServer;
let app;
let accessToken;
let adminToken;
let schoolId;
let courseId;
let userId;
let adminId;

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

const auth = (req) => req.set('Authorization', `Bearer ${accessToken}`);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const user = await User.create({
        name: 'Wallet User',
        email: 'wallet@drivehub.local',
        phone: '0944000099',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.REGISTERED },
        walletBalance: 0,
    });
    await UserRole.create({ userId: user._id, role: ROLES.REGISTERED });
    userId = user._id;
    await User.findByIdAndUpdate(user._id, { profileData: { dateOfBirth: '2000-01-01' } });
    await seedRequiredDocuments(user._id);

    const admin = await User.create({
        name: 'Wallet Admin',
        email: 'wallet-admin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });
    adminId = admin._id;

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'wallet@drivehub.local',
        password: strongPassword,
    });
    accessToken = login.body.data.accessToken;

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'wallet-admin@drivehub.local',
        password: strongPassword,
        portal: 'admin',
    });
    adminToken = adminLogin.body.data.accessToken;

    const school = await DrivingSchool.create({
        name: 'مدرسة المحفظة',
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

    await LicenseCategory.create({ code: 'B', name: 'خصوصي', minAge: 18, isActive: true });
    await PlatformPricing.create({
        categoryCode: 'B',
        subTypeCode: 'B1',
        fixedPrice: 500000,
        currency: 'SYP',
        isActive: true,
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Wallet payment integration', () => {
    it('admin credits user wallet', async () => {
        const res = await request(app)
            .post(`/api/v1/admin/users/${userId}/wallet/credit`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ amount: 600000, note: 'إيصال نقدي #123' });

        expect(res.status).toBe(200);
        expect(res.body.data.balance).toBe(600000);

        const user = await User.findById(userId);
        expect(user.walletBalance).toBe(600000);

        const txCount = await WalletTransaction.countDocuments({ userId, type: 'admin_credit' });
        expect(txCount).toBe(1);
    });

    it('GET admin wallet returns balance and history', async () => {
        const res = await request(app)
            .get(`/api/v1/admin/users/${userId}/wallet`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.balance).toBe(600000);
        expect(res.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('pay from wallet reserves seat and marks enrollment paid', async () => {
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

        const courseBefore = await TrainingCourse.findById(courseId);
        const paidBefore = courseBefore.paidCount;

        const payRes = await auth(
            request(app).post(`/api/v1/enrollments/${enrollmentId}/pay-from-wallet`),
        );
        expect(payRes.status).toBe(200);
        expect(payRes.body.data.enrollment.status).toBe(ENROLLMENT_STATUS.PAID);
        expect(payRes.body.data.walletBalance).toBe(100000);

        const payment = await Payment.findOne({ enrollmentId, status: 'completed' });
        expect(payment.gateway).toBe('wallet');
        expect(payment.amount).toBe(500000);
        expect(payment.platformShare).toBe(10000);

        const courseAfter = await TrainingCourse.findById(courseId);
        expect(courseAfter.paidCount).toBe(paidBefore + 1);

        const studentRole = await UserRole.findOne({ userId, role: ROLES.STUDENT, schoolId });
        expect(studentRole).toBeTruthy();
    });

    it('rejects pay from wallet when balance insufficient', async () => {
        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: paymentDeadlineFromNow(3),
        });
        const enrollmentId = enrollment._id;

        const payRes = await auth(
            request(app).post(`/api/v1/enrollments/${enrollmentId}/pay-from-wallet`),
        );
        expect(payRes.status).toBe(400);
        expect(payRes.body.message).toMatch(/رصيدك غير كافٍ/);
        expect(payRes.body.message).toMatch(/100000/);

        const updated = await Enrollment.findById(enrollmentId);
        expect(updated.status).toBe(ENROLLMENT_STATUS.AWAITING_PAYMENT);
    });

    it('walletService rejects invalid credit amount', async () => {
        await expect(walletService.creditUser({
            userId,
            amount: 0,
            adminId,
        })).rejects.toMatchObject({ statusCode: 400 });
    });
});
