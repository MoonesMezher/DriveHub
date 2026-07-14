const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, Testimonial } = require('../../src/models');
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
        name: 'Testimonials Admin',
        email: 'testi-admin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'testi-admin@drivehub.local',
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
    await Testimonial.deleteMany({});
});

describe('Testimonials API', () => {
    it('GET /testimonials returns empty list when no items', async () => {
        const res = await request(app).get('/api/v1/testimonials');
        expect(res.status).toBe(200);
        expect(res.body.data.items).toEqual([]);
    });

    it('admin CRUD lifecycle', async () => {
        const createRes = await request(app)
            .post('/api/v1/admin/testimonials')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'أحمد ك.',
                role: 'طالب',
                quote: 'منصة ممتازة وسهلة الاستخدام.',
                rating: 5,
                order: 1,
                isActive: true,
            });

        expect(createRes.status).toBe(201);
        const id = createRes.body.data.item._id;

        const listAdmin = await request(app)
            .get('/api/v1/admin/testimonials')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(listAdmin.status).toBe(200);
        expect(listAdmin.body.data.items).toHaveLength(1);

        const publicRes = await request(app).get('/api/v1/testimonials');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.data.items[0].name).toBe('أحمد ك.');

        const patchRes = await request(app)
            .patch(`/api/v1/admin/testimonials/${id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isActive: false });
        expect(patchRes.status).toBe(200);

        const hidden = await request(app).get('/api/v1/testimonials');
        expect(hidden.body.data.items).toHaveLength(0);

        const deleteRes = await request(app)
            .delete(`/api/v1/admin/testimonials/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(deleteRes.status).toBe(200);
    });

    it('public list returns active items sorted by order', async () => {
        await Testimonial.create([
            { name: 'ب2', quote: 'رأي 2', order: 2, isActive: true },
            { name: 'ب1', quote: 'رأي 1', order: 1, isActive: true },
            { name: 'ب3', quote: 'رأي 3', order: 3, isActive: false },
        ]);

        const res = await request(app).get('/api/v1/testimonials');
        expect(res.status).toBe(200);
        expect(res.body.data.items.map((i) => i.name)).toEqual(['ب1', 'ب2']);
    });
});
