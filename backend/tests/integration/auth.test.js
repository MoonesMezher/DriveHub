const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, RefreshToken } = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
});

afterEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        UserRole.deleteMany({}),
        RefreshToken.deleteMany({}),
    ]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const strongPassword = 'SecurePass1!';

describe('Auth API', () => {
    it('registers a new user with registered role', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({
            name: 'Test User',
            email: 'test@drivehub.local',
            phone: '0500000000',
            password: strongPassword,
        });

        expect(res.status).toBe(201);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
        expect(res.body.data.user.activeContext.role).toBe(ROLES.REGISTERED);
    });

    it('logs in and returns tokens', async () => {
        const hash = await passwordService.hashPassword(strongPassword);
        const user = await User.create({
            name: 'Login User',
            email: 'login@drivehub.local',
            password: hash,
            activeContext: { role: ROLES.REGISTERED },
        });
        await UserRole.create({ userId: user._id, role: ROLES.REGISTERED });

        const res = await request(app).post('/api/v1/auth/login').send({
            email: 'login@drivehub.local',
            password: strongPassword,
            portal: 'student',
        });

        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    it('rejects login for wrong portal', async () => {
        const hash = await passwordService.hashPassword(strongPassword);
        const user = await User.create({
            name: 'Student Only',
            email: 'student@drivehub.local',
            password: hash,
            activeContext: { role: ROLES.STUDENT },
        });
        await UserRole.create({ userId: user._id, role: ROLES.STUDENT });

        const res = await request(app).post('/api/v1/auth/login').send({
            email: 'student@drivehub.local',
            password: strongPassword,
            portal: 'admin',
        });

        expect(res.status).toBe(403);
    });

    it('refreshes access token with valid refresh token', async () => {
        const reg = await request(app).post('/api/v1/auth/register').send({
            name: 'Refresh User',
            email: 'refresh@drivehub.local',
            password: strongPassword,
        });

        const refreshToken = reg.body.data.refreshToken;
        const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.accessToken).not.toBe(reg.body.data.accessToken);
    });

    it('GET /me returns authenticated user', async () => {
        const reg = await request(app).post('/api/v1/auth/register').send({
            name: 'Me User',
            email: 'me@drivehub.local',
            password: strongPassword,
        });

        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${reg.body.data.accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe('me@drivehub.local');
        expect(res.body.data.user.permissions).toBeInstanceOf(Array);
    });

    it('switch-context changes active role when user has role', async () => {
        const hash = await passwordService.hashPassword(strongPassword);
        const user = await User.create({
            name: 'Multi Role',
            email: 'multi@drivehub.local',
            password: hash,
            activeContext: { role: ROLES.COACH },
        });
        await UserRole.create({ userId: user._id, role: ROLES.COACH });
        await UserRole.create({ userId: user._id, role: ROLES.STUDENT });

        const login = await request(app).post('/api/v1/auth/login').send({
            email: 'multi@drivehub.local',
            password: strongPassword,
        });

        const res = await request(app)
            .post('/api/v1/auth/switch-context')
            .set('Authorization', `Bearer ${login.body.data.accessToken}`)
            .send({ role: ROLES.STUDENT });

        expect(res.status).toBe(200);
        expect(res.body.data.user.activeContext.role).toBe(ROLES.STUDENT);
    });

    it('logout revokes refresh token', async () => {
        const reg = await request(app).post('/api/v1/auth/register').send({
            name: 'Logout User',
            email: 'logout@drivehub.local',
            password: strongPassword,
        });

        const logout = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${reg.body.data.accessToken}`)
            .send({ refreshToken: reg.body.data.refreshToken });

        expect(logout.status).toBe(200);

        const refresh = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: reg.body.data.refreshToken });

        expect(refresh.status).toBe(401);
    });
});
