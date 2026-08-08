const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const {
    User,
    UserRole,
    RefreshToken,
    SchoolApplication,
    DrivingSchool,
    Notification,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

jest.setTimeout(30000);

let mongoServer;
let app;
let adminToken;
let applicantId;
let pendingApplicationId;
let rejectApplicationId;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const admin = await User.create({
        name: 'Compliance Admin',
        email: 'compliance-admin@drivehub.local',
        phone: '0945000001',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const applicant = await User.create({
        name: 'School Owner',
        email: 'owner@drivehub.local',
        phone: '0945000002',
        password: await passwordService.hashPassword(strongPassword),
        profileData: { nationalId: '12345678901' },
        activeContext: { role: ROLES.REGISTERED },
    });
    applicantId = applicant._id;
    await UserRole.create({ userId: applicant._id, role: ROLES.REGISTERED });

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'compliance-admin@drivehub.local',
        password: strongPassword,
    });
    adminToken = login.body.data.accessToken;
});

beforeEach(async () => {
    await Promise.all([
        SchoolApplication.deleteMany({}),
        DrivingSchool.deleteMany({}),
        Notification.deleteMany({}),
    ]);

    const pendingApplication = await SchoolApplication.create({
        applicantUserId: applicantId,
        schoolName: 'مدرسة الامتثال',
        address: 'دمشق - المزة',
        governorate: 'دمشق',
        lat: 33.5,
        lng: 36.3,
        licenses: ['B', 'C'],
        phone: '01111111',
        email: 'school@drivehub.local',
        bankAccount: 'SY00TESTBANK123456789',
        status: 'pending',
    });
    pendingApplicationId = pendingApplication._id;

    const secondPending = await SchoolApplication.create({
        applicantUserId: applicantId,
        schoolName: 'مدرسة رفض',
        address: 'حلب',
        governorate: 'حلب',
        lat: 36.2,
        lng: 37.1,
        licenses: ['B'],
        phone: '02222222',
        email: 'reject@drivehub.local',
        bankAccount: 'SY00REJECTBANK123',
        status: 'pending',
    });
    rejectApplicationId = secondPending._id;
});

afterAll(async () => {
    await Promise.all([
        User.deleteMany({}),
        UserRole.deleteMany({}),
        RefreshToken.deleteMany({}),
        SchoolApplication.deleteMany({}),
        DrivingSchool.deleteMany({}),
        Notification.deleteMany({}),
    ]);
    await mongoose.disconnect();
    await mongoServer.stop();
});

const auth = (req) => req.set('Authorization', `Bearer ${adminToken}`);

describe('Admin compliance APIs', () => {
    it('GET /admin/compliance returns pending requests with summary fields', async () => {
        const res = await auth(request(app).get('/api/v1/admin/compliance'));
        expect(res.status).toBe(200);
        expect(res.body.data.requests.length).toBe(2);
        expect(res.body.data.requests[0]).toMatchObject({
            type: 'school_onboarding',
        });
        expect(res.body.data.requests[0]).toHaveProperty('ownerName');
    });

    it('GET /admin/compliance/:id returns full detail payload', async () => {
        const res = await auth(request(app).get(`/api/v1/admin/compliance/${pendingApplicationId}`));
        expect(res.status).toBe(200);
        expect(res.body.data.request.school.name).toBe('مدرسة الامتثال');
        expect(res.body.data.request.owner.nationalId).toBe('12345678901');
        expect(res.body.data.request.bank.iban).toBe('SY00TESTBANK123456789');
    });

    it('POST /admin/compliance/:id/approve approves and creates school', async () => {
        const res = await auth(request(app).post(`/api/v1/admin/compliance/${pendingApplicationId}/approve`));
        expect(res.status).toBe(200);

        const updated = await SchoolApplication.findById(pendingApplicationId);
        expect(updated.status).toBe('approved');
        expect(updated.createdSchoolId).toBeTruthy();

        const createdSchool = await DrivingSchool.findById(updated.createdSchoolId);
        expect(createdSchool).toBeTruthy();
        expect(createdSchool.name).toBe('مدرسة الامتثال');
    });

    it('POST /admin/compliance/:id/reject rejects with reason', async () => {
        const reason = 'البيانات البنكية غير مكتملة';
        const res = await auth(
            request(app).post(`/api/v1/admin/compliance/${rejectApplicationId}/reject`).send({ rejectionReason: reason }),
        );
        expect(res.status).toBe(200);

        const updated = await SchoolApplication.findById(rejectApplicationId);
        expect(updated.status).toBe('rejected');
        expect(updated.rejectionReason).toBe(reason);
    });
});
