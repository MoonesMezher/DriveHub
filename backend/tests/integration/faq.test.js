const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, FaqItem } = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

let mongoServer;
let app;
let adminToken;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const admin = await User.create({
        name: 'FAQ Admin',
        email: 'faq-admin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'faq-admin@drivehub.local',
        password: strongPassword,
        portal: 'admin',
    });
    adminToken = adminLogin.body.data.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await FaqItem.deleteMany({});
});

describe('FAQ API', () => {
    it('GET /faq returns empty list when no items', async () => {
        const res = await request(app).get('/api/v1/faq');
        expect(res.status).toBe(200);
        expect(res.body.data.items).toEqual([]);
    });

    it('admin CRUD lifecycle', async () => {
        const createRes = await request(app)
            .post('/api/v1/admin/faq')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'كيف أسجّل؟',
                answer: 'من صفحة التسجيل.',
                order: 1,
                isActive: true,
            });

        expect(createRes.status).toBe(201);
        const id = createRes.body.data.item._id;

        const listAdmin = await request(app)
            .get('/api/v1/admin/faq')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(listAdmin.status).toBe(200);
        expect(listAdmin.body.data.items).toHaveLength(1);

        const publicRes = await request(app).get('/api/v1/faq');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.data.items[0].question).toBe('كيف أسجّل؟');

        const patchRes = await request(app)
            .patch(`/api/v1/admin/faq/${id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isActive: false });
        expect(patchRes.status).toBe(200);

        const hidden = await request(app).get('/api/v1/faq');
        expect(hidden.body.data.items).toHaveLength(0);

        const deleteRes = await request(app)
            .delete(`/api/v1/admin/faq/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(deleteRes.status).toBe(200);

        const afterDelete = await request(app)
            .get('/api/v1/admin/faq')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(afterDelete.body.data.items).toHaveLength(0);
    });

    it('public list returns active items sorted by order', async () => {
        await FaqItem.create([
            { question: 'س2', answer: 'ج2', order: 2, isActive: true },
            { question: 'س1', answer: 'ج1', order: 1, isActive: true },
            { question: 'س3', answer: 'ج3', order: 3, isActive: false },
        ]);

        const res = await request(app).get('/api/v1/faq');
        expect(res.status).toBe(200);
        expect(res.body.data.items.map((i) => i.question)).toEqual(['س1', 'س2']);
    });

    it('accepts optional http(s) linkUrl and linkLabel', async () => {
        const createRes = await request(app)
            .post('/api/v1/admin/faq')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'أين صفحة التسجيل؟',
                answer: 'يمكنك التسجيل من الرابط أدناه.',
                linkUrl: 'https://example.com/register',
                linkLabel: 'صفحة التسجيل',
                isActive: true,
            });

        expect(createRes.status).toBe(201);
        expect(createRes.body.data.item.linkUrl).toBe('https://example.com/register');
        expect(createRes.body.data.item.linkLabel).toBe('صفحة التسجيل');

        const publicRes = await request(app).get('/api/v1/faq');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.data.items[0].linkUrl).toBe('https://example.com/register');
        expect(publicRes.body.data.items[0].linkLabel).toBe('صفحة التسجيل');
    });

    it('rejects non-http linkUrl', async () => {
        const res = await request(app)
            .post('/api/v1/admin/faq')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                question: 'سؤال برابط غير صالح',
                answer: 'إجابة قصيرة للاختبار.',
                linkUrl: 'javascript:alert(1)',
            });

        expect(res.status).toBe(400);
    });
});
