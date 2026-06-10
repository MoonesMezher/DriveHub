const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole } = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

let mongoServer;
let app;
let studentToken;
let managerToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const student = await User.create({
        name: 'Student',
        email: 'stub-student@drivehub.local',
        password: await passwordService.hashPassword('SecurePass1!'),
        activeContext: { role: ROLES.STUDENT },
    });
    await UserRole.create({ userId: student._id, role: ROLES.STUDENT });

    const manager = await User.create({
        name: 'Manager',
        email: 'stub-manager@drivehub.local',
        password: await passwordService.hashPassword('SecurePass1!'),
        activeContext: { role: ROLES.MANAGER, schoolId: new mongoose.Types.ObjectId() },
    });
    await UserRole.create({ userId: manager._id, role: ROLES.MANAGER, schoolId: manager.activeContext.schoolId });

    const sLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'stub-student@drivehub.local',
        password: 'SecurePass1!',
        portal: 'student',
    });
    studentToken = sLogin.body.data.accessToken;

    const mLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'stub-manager@drivehub.local',
        password: 'SecurePass1!',
        portal: 'school',
    });
    managerToken = mLogin.body.data.accessToken;
});

afterAll(async () => {
    await User.deleteMany({});
    await UserRole.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('API endpoints — implemented services', () => {
    it('GET /student/dashboard → 200', async () => {
        const res = await request(app)
            .get('/api/v1/student/dashboard')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.dashboard).toBeDefined();
    });

    it('GET /manager/instructors → 200', async () => {
        const res = await request(app)
            .get('/api/v1/manager/instructors')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.instructors).toBeDefined();
    });
});

describe('API scaffold — validation before handler', () => {
    it('POST /student/practice/submit without body → 400', async () => {
        const res = await request(app)
            .post('/api/v1/student/practice/submit')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });
});
