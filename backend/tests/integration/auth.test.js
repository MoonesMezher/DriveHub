const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, RefreshToken, PasswordResetToken } = require('../../src/models');
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
    jest.restoreAllMocks();
    await Promise.all([
        User.deleteMany({}),
        UserRole.deleteMany({}),
        RefreshToken.deleteMany({}),
        PasswordResetToken.deleteMany({}),
    ]);
});

beforeEach(() => {
    jest.spyOn(require('../../src/services/notificationChannels'), 'sendEmail')
        .mockResolvedValue({ sent: true, channel: 'email' });
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

    it('forgot-password always returns generic success', async () => {
        const existingRes = await request(app).post('/api/v1/auth/forgot-password').send({
            email: 'existing@drivehub.local',
        });
        const missingRes = await request(app).post('/api/v1/auth/forgot-password').send({
            email: 'missing@drivehub.local',
        });
        expect(existingRes.status).toBe(200);
        expect(missingRes.status).toBe(200);
        expect(existingRes.body.message).toEqual(missingRes.body.message);
    });

    it('forgot-password returns generic success when email send fails', async () => {
        const userEmail = 'mailfail@drivehub.local';
        await request(app).post('/api/v1/auth/register').send({
            name: 'Mail Fail',
            email: userEmail,
            password: strongPassword,
        });

        const channels = require('../../src/services/notificationChannels');
        channels.sendEmail.mockRejectedValueOnce(
            new Error('Demo domains can only be used to send emails to account owners'),
        );

        const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: userEmail });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBeDefined();
        expect(JSON.stringify(res.body)).not.toMatch(/mailtrap|demo domain/i);
        expect(await PasswordResetToken.findOne({ email: userEmail })).toBeTruthy();
    });

    it('verifies code and resets password via resetToken', async () => {
        const userEmail = 'reset-flow@drivehub.local';
        const reg = await request(app).post('/api/v1/auth/register').send({
            name: 'Reset Flow',
            email: userEmail,
            password: strongPassword,
        });
        expect(reg.status).toBe(201);

        await request(app).post('/api/v1/auth/forgot-password').send({ email: userEmail });
        const tokenDoc = await PasswordResetToken.findOne({ email: userEmail });
        tokenDoc.codeHash = require('crypto').createHash('sha256').update('123456').digest('hex');
        await tokenDoc.save();

        const verify = await request(app).post('/api/v1/auth/verify-reset-code').send({
            email: userEmail,
            code: '123456',
        });
        expect(verify.status).toBe(200);
        expect(verify.body.data.resetToken).toBeDefined();

        const reset = await request(app).post('/api/v1/auth/reset-password').send({
            email: userEmail,
            resetToken: verify.body.data.resetToken,
            newPassword: 'NewSecurePass1!',
        });
        expect(reset.status).toBe(200);

        const login = await request(app).post('/api/v1/auth/login').send({
            email: userEmail,
            password: 'NewSecurePass1!',
        });
        expect(login.status).toBe(200);
    });

    it('rejects expired code and too many attempts', async () => {
        const userEmail = 'attempts@drivehub.local';
        await request(app).post('/api/v1/auth/register').send({
            name: 'Attempts',
            email: userEmail,
            password: strongPassword,
        });
        await request(app).post('/api/v1/auth/forgot-password').send({ email: userEmail });

        const tokenDoc = await PasswordResetToken.findOne({ email: userEmail });
        tokenDoc.codeHash = require('crypto').createHash('sha256').update('123456').digest('hex');
        tokenDoc.maxAttempts = 2;
        tokenDoc.expiresAt = new Date(Date.now() - 1000);
        await tokenDoc.save();

        const expired = await request(app).post('/api/v1/auth/verify-reset-code').send({
            email: userEmail,
            code: '123456',
        });
        expect(expired.status).toBe(400);

        tokenDoc.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        tokenDoc.attemptCount = 1;
        await tokenDoc.save();
        const wrong1 = await request(app).post('/api/v1/auth/verify-reset-code').send({
            email: userEmail,
            code: '111111',
        });
        expect([400, 429]).toContain(wrong1.status);

        const wrong2 = await request(app).post('/api/v1/auth/verify-reset-code').send({
            email: userEmail,
            code: '111111',
        });
        expect(wrong2.status).toBe(429);
    });
});
