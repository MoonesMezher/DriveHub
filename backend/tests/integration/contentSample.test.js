const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, TheoryContent, PracticalVideo } = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

let mongoServer;
let app;
let registeredToken;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    await TheoryContent.create({
        categoryCode: 'B',
        phase: 0,
        title: 'جلسة مجانية — مقدمة',
        body: 'محتوى العينة الجزئية',
        order: 0,
        isSample: true,
        sampleTier: 'partial',
        isActive: true,
        interactiveQuestions: [
            {
                text: 'ماذا يعني الضوء الأحمر؟',
                type: 'mcq',
                options: [
                    { key: 'A', text: 'قف' },
                    { key: 'B', text: 'انطلق' },
                ],
                correctAnswer: 'A',
                status: 'active',
            },
        ],
    });

    await TheoryContent.create({
        categoryCode: 'B',
        phase: 0,
        title: 'جلسة إضافية للمسجّلين',
        body: 'محتوى العينة الكاملة',
        order: 1,
        isSample: true,
        sampleTier: 'full',
        isActive: true,
    });

    // Legacy free session without sampleTier — must still appear for guests
    await TheoryContent.create({
        categoryCode: 'B',
        phase: 0,
        title: 'جلسة قديمة بدون مستوى',
        body: 'محتوى عينة قديم',
        order: 2,
        isSample: true,
        sampleTier: null,
        isActive: true,
    });

    await PracticalVideo.create({
        categoryCode: 'B',
        phase: 0,
        title: 'فيديو الجلسة المجانية',
        url: 'https://example.com/sample.mp4',
        order: 0,
        isSample: true,
        isActive: true,
    });

    const registered = await User.create({
        name: 'Sample Registered',
        email: 'sample-reg@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.REGISTERED },
    });
    await UserRole.create({ userId: registered._id, role: ROLES.REGISTERED });
    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'sample-reg@drivehub.local',
        password: strongPassword,
        portal: 'student',
    });
    registeredToken = login.body.data.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('GET /content/sample (free sessions)', () => {
    it('returns partial free sessions for guests', async () => {
        const res = await request(app).get('/api/v1/content/sample?categoryCode=B');
        expect(res.status).toBe(200);
        expect(res.body.data.tier).toBe('partial');
        expect(res.body.data.articles.length).toBeGreaterThanOrEqual(2);
        expect(res.body.data.articles.every((a) => a.title)).toBe(true);
        expect(res.body.data.videos.length).toBe(1);
        expect(res.body.data.questions.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data.articles.some((a) => a.title.includes('إضافية'))).toBe(false);
        expect(res.body.data.articles.some((a) => a.title.includes('قديمة'))).toBe(true);
    });

    it('returns full sample tier for registered users', async () => {
        const res = await request(app)
            .get('/api/v1/content/sample?categoryCode=B')
            .set('Authorization', `Bearer ${registeredToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.tier).toBe('full');
        expect(res.body.data.articles.length).toBeGreaterThanOrEqual(3);
        expect(res.body.data.videos.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data.articles.some((a) => a.title.includes('مقدمة'))).toBe(true);
    });

    it('also accepts legacy category query param', async () => {
        const res = await request(app).get('/api/v1/content/sample?category=B');
        expect(res.status).toBe(200);
        expect(res.body.data.articles.length).toBeGreaterThanOrEqual(1);
    });
});
