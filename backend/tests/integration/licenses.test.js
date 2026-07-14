const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const { User, UserRole, LicenseCategory } = require('../../src/models');
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
        name: 'License Admin',
        email: 'license-admin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'license-admin@drivehub.local',
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
    await LicenseCategory.deleteMany({});
});

const LICENSE_MATRIX = [
    {
        code: 'B',
        name: 'غير تجاري',
        briefDesc: 'غير تجاري — حتى 8 ركاب',
        fullDesc: 'رخصة غير تجارية مخصصة لقيادة السيارات الخاصة والكرافانات بعدد ركاب لا يتجاوز 8 ركاب.',
        requirementsIntro: 'متطلبات رخصة B (غير تجارية)',
        minAge: 18,
        prerequisites: [],
        vehicleTypes: 'سيارات خاصة وكرافان حتى 8 ركاب',
    },
    {
        code: 'C',
        name: 'فئة C',
        briefDesc: 'بعد B لثلاث سنوات',
        fullDesc: 'فئة C تتطلب امتلاك رخصة B لمدة 3 سنوات على الأقل، وتغطي مركبات حتى 10 ركاب أو حمولة حتى 4 أطنان.',
        requirementsIntro: 'متطلبات رخصة C',
        minAge: 21,
        prerequisites: [{ label: 'امتلاك رخصة B لمدة 3 سنوات', code: 'B', isRequired: true, type: 'license' }],
        vehicleTypes: 'مركبات حتى 10 ركاب أو حمولة حتى 4 أطنان',
    },
    {
        code: 'D1',
        name: 'فئة D1',
        briefDesc: 'بعد C لسنتين',
        fullDesc: 'فئة D1 تتطلب امتلاك رخصة C لمدة سنتين على الأقل، وتغطي مركبات حتى 24 راكباً أو حمولة حتى 11 طناً.',
        requirementsIntro: 'متطلبات رخصة D1',
        minAge: 23,
        prerequisites: [{ label: 'امتلاك رخصة C لمدة سنتين', code: 'C', isRequired: true, type: 'license' }],
        vehicleTypes: 'مركبات حتى 24 راكباً أو حمولة حتى 11 طناً',
    },
    {
        code: 'D2',
        name: 'فئة D2',
        briefDesc: 'باصات وشاحنات',
        fullDesc: 'فئة D2 تتطلب امتلاك رخصة D1 لمدة سنتين على الأقل، وتغطي قيادة الباصات والشاحنات.',
        requirementsIntro: 'متطلبات رخصة D2',
        minAge: 25,
        prerequisites: [{ label: 'امتلاك رخصة D1 لمدة سنتين', code: 'D1', isRequired: true, type: 'license' }],
        vehicleTypes: 'باصات وشاحنات',
    },
    {
        code: 'A',
        name: 'فئة A',
        briefDesc: 'دراجات نارية — فحص خاص',
        fullDesc: 'فئة A مخصصة للدراجات النارية وتتطلب اجتياز فحص خاص للدراجات النارية.',
        requirementsIntro: 'متطلبات رخصة A',
        minAge: 18,
        prerequisites: [{ label: 'اجتياز فحص خاص بالدراجات النارية', type: 'basic', isRequired: true }],
        vehicleTypes: 'دراجات نارية',
    },
    {
        code: 'H',
        name: 'فئة H',
        briefDesc: 'للأغراض المخصصة',
        fullDesc: 'فئة H مخصصة للأغراض الخاصة بقيادة الآليات الزراعية.',
        requirementsIntro: 'متطلبات رخصة H',
        minAge: 18,
        prerequisites: [{ label: 'ترخيص لغرض مخصص (آليات زراعية)', type: 'basic', isRequired: true }],
        vehicleTypes: 'الآليات الزراعية',
    },
    {
        code: 'W',
        name: 'فئة W',
        briefDesc: 'ذوو الاحتياجات الخاصة',
        fullDesc: 'فئة W مخصصة لقيادة مركبات ذوي الاحتياجات الخاصة وتتطلب تقريراً طبياً معتمداً.',
        requirementsIntro: 'متطلبات رخصة W',
        minAge: 18,
        prerequisites: [{ label: 'تقرير طبي معتمد', type: 'medical', isRequired: true }],
        vehicleTypes: 'مركبات ذوي الاحتياجات الخاصة',
    },
];

describe('License categories API', () => {
    it('admin upserts full license matrix and public endpoints return exact values', async () => {
        for (let i = 0; i < LICENSE_MATRIX.length; i += 1) {
            const license = LICENSE_MATRIX[i];
            const upsertRes = await request(app)
                .put('/api/v1/admin/licenses/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    ...license,
                    order: i + 1,
                    isActive: true,
                });

            expect(upsertRes.status).toBe(200);
            expect(upsertRes.body.data.license.code).toBe(license.code);
            expect(upsertRes.body.data.license.minAge).toBe(license.minAge);
            expect(upsertRes.body.data.license.vehicleTypes).toBe(license.vehicleTypes);
            expect(upsertRes.body.data.license.requirementsIntro).toBe(license.requirementsIntro);
            expect(upsertRes.body.data.license.prerequisites).toHaveLength(license.prerequisites.length);
        }

        const listAdmin = await request(app)
            .get('/api/v1/admin/licenses')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(listAdmin.status).toBe(200);
        expect(listAdmin.body.data.licenses).toHaveLength(LICENSE_MATRIX.length);

        const publicListRes = await request(app).get('/api/v1/licenses');
        expect(publicListRes.status).toBe(200);
        expect(publicListRes.body.data).toHaveLength(LICENSE_MATRIX.length);

        const publicRes = await request(app).get('/api/v1/licenses/D1');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.data.code).toBe('D1');
        expect(publicRes.body.data.minAge).toBe(23);
        expect(publicRes.body.data.vehicleTypes).toBe('مركبات حتى 24 راكباً أو حمولة حتى 11 طناً');
        expect(publicRes.body.data.prerequisites[0]).toMatchObject({
            code: 'C',
            type: 'license',
            isRequired: true,
        });
    });

    it('accepts legacy string prerequisites for backward compatibility', async () => {
        const upsertRes = await request(app)
            .put('/api/v1/admin/licenses/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                code: 'D1',
                name: 'عمومي متوسط',
                minAge: 23,
                prerequisites: ['C'],
            });

        expect(upsertRes.status).toBe(200);
        expect(upsertRes.body.data.license.prerequisites[0]).toMatchObject({
            code: 'C',
            type: 'license',
            isRequired: true,
        });
    });

    it('rejects invalid prerequisite type', async () => {
        const res = await request(app)
            .put('/api/v1/admin/licenses/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                code: 'X',
                name: 'اختبار',
                minAge: 18,
                prerequisites: [{ label: 'bad', type: 'invalid' }],
            });

        expect(res.status).toBe(400);
    });
});
