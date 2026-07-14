const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const fs = require('fs/promises');
const path = require('path');
const createApp = require('../../src/app');
const { User, UserRole, DrivingSchool } = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');

let mongoServer;
let app;
let adminToken;
let managerToken;

const strongPassword = 'SecurePass1!';

jest.setTimeout(30000);

const TEST_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const admin = await User.create({
        name: 'Media Admin',
        email: 'mediaadmin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const school = await DrivingSchool.create({
        name: 'مدرسة الوسائط',
        address: 'دمشق',
        lat: 33.5,
        lng: 36.2,
        licenses: ['B'],
        status: 'active',
    });

    const manager = await User.create({
        name: 'Media Manager',
        email: 'mediamanager@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.MANAGER, schoolId: school._id },
    });
    await UserRole.create({ userId: manager._id, role: ROLES.MANAGER, schoolId: school._id });

    const adminLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'mediaadmin@drivehub.local', password: strongPassword, portal: 'admin' });
    adminToken = adminLogin.body.data.accessToken;

    const managerLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'mediamanager@drivehub.local', password: strongPassword, portal: 'school' });
    managerToken = managerLogin.body.data.accessToken;
});

afterAll(async () => {
    const uploadDir = path.join(__dirname, '../../uploads/media');
    try {
        const files = await fs.readdir(uploadDir);
        await Promise.all(files.map((f) => fs.unlink(path.join(uploadDir, f))));
    } catch {
        // ignore
    }
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Media upload API', () => {
    it('uploads an image and serves it publicly', async () => {
        const uploadRes = await request(app)
            .post('/api/v1/media')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('category', 'ad')
            .attach('file', TEST_PNG, { filename: 'banner.png', contentType: 'image/png' });

        expect(uploadRes.status).toBe(201);
        expect(uploadRes.body.data.media.url).toMatch(/^\/api\/v1\/media\/[a-f0-9]{24}$/i);

        const mediaId = uploadRes.body.data.media.id;
        const serveRes = await request(app).get(`/api/v1/media/${mediaId}`);
        expect(serveRes.status).toBe(200);
        expect(serveRes.headers['content-type']).toMatch(/image\/png/);
    });

    it('rejects external image URL when creating an ad', async () => {
        const res = await request(app)
            .post('/api/v1/admin/ads')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'إعلان تجريبي',
                imageUrl: 'https://example.com/banner.jpg',
                placement: 'home',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/رابط خارجي|ملف صورة/i);
    });

    it('creates ad with uploaded media reference', async () => {
        const uploadRes = await request(app)
            .post('/api/v1/media')
            .set('Authorization', `Bearer ${adminToken}`)
            .field('category', 'ad')
            .attach('file', TEST_PNG, { filename: 'ad.png', contentType: 'image/png' });

        const imageUrl = uploadRes.body.data.media.url;

        const adRes = await request(app)
            .post('/api/v1/admin/ads')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'إعلان بصورة مرفوعة',
                imageUrl,
                placement: 'home',
            });

        expect(adRes.status).toBe(201);
        expect(adRes.body.data.imageUrl).toBe(imageUrl);
    });

    it('rejects external image URL in theory content', async () => {
        const res = await request(app)
            .post('/api/v1/manager/content/theory')
            .set('Authorization', `Bearer ${managerToken}`)
            .send({
                categoryCode: 'B',
                phase: 1,
                title: 'درس تجريبي',
                body: 'محتوى تجريبي للتحقق من رفض الروابط الخارجية للصور',
                imageUrl: 'https://cdn.example.com/sign.png',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/رابط خارجي|ملف صورة/i);
    });
});
