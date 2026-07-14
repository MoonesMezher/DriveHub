const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const {
    User,
    UserRole,
    DrivingSchool,
    TrainingCourse,
    Enrollment,
    TheoryContent,
    ContentUnlockMode,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');

let mongoServer;
let app;
let studentToken;
let studentId;
let phase1ContentId;
let phase2ContentId;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const user = await User.create({
        name: 'Progressive Student',
        email: 'progressive@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.STUDENT },
    });
    studentId = user._id;
    await UserRole.create({ userId: user._id, role: ROLES.STUDENT });

    const school = await DrivingSchool.create({
        name: 'مدرسة تقدم',
        address: 'دمشق',
        lat: 33.5,
        lng: 36.2,
        licenses: ['B'],
        status: 'active',
    });

    const course = await TrainingCourse.create({
        schoolId: school._id,
        categoryCode: 'B',
        subTypeCode: 'B1',
        maxStudents: 10,
        registrationOpen: true,
    });

    await Enrollment.create({
        userId: studentId,
        courseId: course._id,
        schoolId: school._id,
        categoryCode: 'B',
        subTypeCode: 'B1',
        status: ENROLLMENT_STATUS.ACTIVE,
    });

    const phase1a = await TheoryContent.create({
        categoryCode: 'B',
        phase: 1,
        title: 'الفصل 1 — درس أ',
        body: 'محتوى الدرس الأول',
        order: 1,
    });
    phase1ContentId = phase1a._id;

    await TheoryContent.create({
        categoryCode: 'B',
        phase: 1,
        title: 'الفصل 1 — درس ب',
        body: 'محتوى الدرس الثاني',
        order: 2,
    });

    const phase2 = await TheoryContent.create({
        categoryCode: 'B',
        phase: 2,
        title: 'الفصل 2 — درس أ',
        body: 'محتوى مقفل',
        order: 1,
    });
    phase2ContentId = phase2._id;

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'progressive@drivehub.local',
        password: strongPassword,
    });
    studentToken = login.body.data.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const auth = (req) => req.set('Authorization', `Bearer ${studentToken}`);

describe('progressive content unlock', () => {
    it('returns only phase 1 theory in progressive mode', async () => {
        await ContentUnlockMode.findOneAndUpdate(
            { userId: studentId, categoryCode: 'B' },
            { mode: 'progressive', maxUnlockedPhase: 1, viewedContentIds: [] },
            { upsert: true },
        );

        const res = await auth(request(app).get('/api/v1/student/content/theory'));
        expect(res.status).toBe(200);
        const phases = [...new Set(res.body.data.items.map((i) => i.phase))];
        expect(phases).toEqual([1]);
    });

    it('blocks locked theory detail with 403', async () => {
        const res = await auth(request(app).get(`/api/v1/student/content/theory/${phase2ContentId}`));
        expect(res.status).toBe(403);
    });

    it('unlocks next phase after completing all lessons in current phase', async () => {
        const items = await TheoryContent.find({ categoryCode: 'B', phase: 1, isActive: true });
        for (const item of items) {
            const res = await auth(
                request(app).post(`/api/v1/student/content/theory/${item._id}/complete`),
            );
            expect(res.status).toBe(200);
        }

        const listRes = await auth(request(app).get('/api/v1/student/content/theory'));
        const phases = [...new Set(listRes.body.data.items.map((i) => i.phase))].sort();
        expect(phases).toEqual([1, 2]);

        const detailRes = await auth(request(app).get(`/api/v1/student/content/theory/${phase2ContentId}`));
        expect(detailRes.status).toBe(200);
    });

    it('returns all phases in full unlock mode', async () => {
        await auth(
            request(app).post('/api/v1/student/content/unlock').send({ categoryCode: 'B', mode: 'full' }),
        );

        const res = await auth(request(app).get('/api/v1/student/content/theory'));
        const phases = [...new Set(res.body.data.items.map((i) => i.phase))].sort();
        expect(phases).toEqual([1, 2]);
    });

    it('POST /manager/exam-results route does not exist', async () => {
        const manager = await User.create({
            name: 'No Results Manager',
            email: 'noresults-mgr@drivehub.local',
            password: await passwordService.hashPassword(strongPassword),
            activeContext: { role: ROLES.MANAGER, schoolId: new mongoose.Types.ObjectId() },
        });
        await UserRole.create({ userId: manager._id, role: ROLES.MANAGER, schoolId: manager.activeContext.schoolId });
        const login = await request(app).post('/api/v1/auth/login').send({
            email: 'noresults-mgr@drivehub.local',
            password: strongPassword,
        });
        const res = await request(app)
            .post('/api/v1/manager/exam-results')
            .set('Authorization', `Bearer ${login.body.data.accessToken}`)
            .send({});
        expect(res.status).toBe(404);
    });
});

describe('practice pass threshold', () => {
    it('exports 60% practice threshold constant', () => {
        const { PRACTICE_PASS_THRESHOLD } = require('../../src/constants/examThresholds');
        expect(PRACTICE_PASS_THRESHOLD).toBe(60);
    });
});
