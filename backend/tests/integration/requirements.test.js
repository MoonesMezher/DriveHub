const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, RequirementItem } = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

jest.setTimeout(30000);

let mongoServer;
let app;
let adminToken;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const admin = await User.create({
        name: 'Requirements Admin',
        email: 'req-admin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'req-admin@drivehub.local',
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
    await RequirementItem.deleteMany({});
});

describe('Requirements API', () => {
    it('GET /requirements returns empty list when no items', async () => {
        const res = await request(app).get('/api/v1/requirements');
        expect(res.status).toBe(200);
        expect(res.body.data.items).toEqual([]);
    });

    it('admin CRUD lifecycle', async () => {
        const createRes = await request(app)
            .post('/api/v1/admin/requirements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                section: 'documents',
                title: 'الهوية الوطنية',
                description: 'بطاقة هوية سارية.',
                icon: 'badge',
                order: 1,
                isActive: true,
            });

        expect(createRes.status).toBe(201);
        expect(createRes.body.data.item.section).toBe('documents');
        const id = createRes.body.data.item._id;

        const listAdmin = await request(app)
            .get('/api/v1/admin/requirements')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(listAdmin.status).toBe(200);
        expect(listAdmin.body.data.items).toHaveLength(1);

        const publicRes = await request(app).get('/api/v1/requirements');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.data.items[0].title).toBe('الهوية الوطنية');

        const patchRes = await request(app)
            .patch(`/api/v1/admin/requirements/${id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ isActive: false });
        expect(patchRes.status).toBe(200);

        const hidden = await request(app).get('/api/v1/requirements');
        expect(hidden.body.data.items).toHaveLength(0);

        const deleteRes = await request(app)
            .delete(`/api/v1/admin/requirements/${id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(deleteRes.status).toBe(200);
    });

    it('supports journey and steps sections without description', async () => {
        const journeyRes = await request(app)
            .post('/api/v1/admin/requirements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                section: 'journey',
                title: 'سجّل',
                icon: 'person_add',
                order: 1,
            });
        expect(journeyRes.status).toBe(201);
        expect(journeyRes.body.data.item.section).toBe('journey');

        const stepsRes = await request(app)
            .post('/api/v1/admin/requirements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                section: 'steps',
                title: 'إنشاء حساب على DriveHub',
                order: 1,
            });
        expect(stepsRes.status).toBe(201);
        expect(stepsRes.body.data.item.section).toBe('steps');

        const bySection = await request(app).get('/api/v1/requirements?section=journey');
        expect(bySection.status).toBe(200);
        expect(bySection.body.data.items).toHaveLength(1);
        expect(bySection.body.data.items[0].title).toBe('سجّل');

        const all = await request(app).get('/api/v1/requirements');
        expect(all.body.data.items).toHaveLength(2);
    });

    it('rejects invalid section', async () => {
        const res = await request(app)
            .post('/api/v1/admin/requirements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                section: 'invalid',
                title: 'عنوان',
                description: 'وصف صالح هنا',
            });
        expect(res.status).toBe(400);
    });

    it('public list returns active items sorted by order', async () => {
        await RequirementItem.create([
            { section: 'documents', title: 'ب2', description: 'وصف 2', order: 2, isActive: true },
            { section: 'documents', title: 'ب1', description: 'وصف 1', order: 1, isActive: true },
            { section: 'documents', title: 'ب3', description: 'وصف 3', order: 3, isActive: false },
        ]);

        const res = await request(app).get('/api/v1/requirements');
        expect(res.status).toBe(200);
        expect(res.body.data.items.map((i) => i.title)).toEqual(['ب1', 'ب2']);
    });
});
