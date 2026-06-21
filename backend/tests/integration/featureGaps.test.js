const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const {
    User,
    UserRole,
    DrivingSchool,
    TrainingCourse,
    PlatformPricing,
    Enrollment,
    LicenseCategory,
    StudentRoster,
    PracticeExamSession,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');
const { COURSE_STATUS } = require('../../src/constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');
const enrollmentService = require('../../src/services/enrollment.service');
const trafficService = require('../../src/services/traffic.service');
const { resolveTrafficResultStatus } = require('../../src/helpers/trafficResult.helper');

let mongoServer;
let app;
let studentToken;
let studentId;
let schoolId;
let courseId;
let enrollmentId;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    await LicenseCategory.create({ code: 'B', name: 'خصوصي', minAge: 18, order: 1 });
    await LicenseCategory.create({ code: 'C', name: 'عمومي', minAge: 21, prerequisites: ['B'], order: 2 });

    const user = await User.create({
        name: 'Gap Test Student',
        email: 'gaps@drivehub.local',
        phone: '0944111111',
        password: await passwordService.hashPassword(strongPassword),
        profileData: { dateOfBirth: '2010-01-01' },
        activeContext: { role: ROLES.REGISTERED },
    });
    studentId = user._id;
    await UserRole.create({ userId: user._id, role: ROLES.REGISTERED });

    const adult = await User.create({
        name: 'Adult Student',
        email: 'adult@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        profileData: { dateOfBirth: '2000-05-15' },
        activeContext: { role: ROLES.REGISTERED },
    });
    await UserRole.create({ userId: adult._id, role: ROLES.REGISTERED });

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'gaps@drivehub.local',
        password: strongPassword,
    });
    studentToken = login.body.data.accessToken;

    const school = await DrivingSchool.create({
        name: 'مدرسة فجوات',
        address: 'دمشق',
        lat: 33.5,
        lng: 36.2,
        licenses: ['B', 'C'],
        status: 'active',
    });
    schoolId = school._id;

    const course = await TrainingCourse.create({
        schoolId,
        categoryCode: 'B',
        subTypeCode: 'B1',
        maxStudents: 10,
        registrationOpen: true,
        status: COURSE_STATUS.REGISTRATION_OPEN,
    });
    courseId = course._id;

    await PlatformPricing.create({ categoryCode: 'B', fixedPrice: 100000, isActive: true });
    await PlatformPricing.create({ categoryCode: 'C', fixedPrice: 200000, isActive: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const auth = (req) => req.set('Authorization', `Bearer ${studentToken}`);

describe('feature gaps', () => {
    it('resolveTrafficResultStatus keeps final_theory_passed on practical fail', () => {
        const result = resolveTrafficResultStatus(
            { status: ENROLLMENT_STATUS.FINAL_THEORY_PASSED },
            { examType: 'practical', passed: false },
        );
        expect(result.status).toBe(ENROLLMENT_STATUS.FINAL_THEORY_PASSED);
        expect(result.needsRetakeScope).toBe(true);
    });

    it('rejects enrollment when under minAge', async () => {
        const res = await auth(
            request(app).post('/api/v1/enrollments').send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
                subTypeCode: 'B1',
            }),
        );
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/الحد الأدنى|العمر/);
    });

    it('rejects enrollment without dateOfBirth', async () => {
        const noDob = await User.create({
            name: 'No DOB',
            email: 'nodob@drivehub.local',
            password: await passwordService.hashPassword(strongPassword),
            activeContext: { role: ROLES.REGISTERED },
        });
        await UserRole.create({ userId: noDob._id, role: ROLES.REGISTERED });
        const login = await request(app).post('/api/v1/auth/login').send({
            email: 'nodob@drivehub.local',
            password: strongPassword,
        });
        const res = await request(app)
            .post('/api/v1/enrollments')
            .set('Authorization', `Bearer ${login.body.data.accessToken}`)
            .send({
                courseId: courseId.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'B',
                subTypeCode: 'B1',
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/تاريخ الميلاد/);
    });

    it('rejects prerequisite C without B', async () => {
        const adultLogin = await request(app).post('/api/v1/auth/login').send({
            email: 'adult@drivehub.local',
            password: strongPassword,
        });
        const cCourse = await TrainingCourse.create({
            schoolId,
            categoryCode: 'C',
            maxStudents: 5,
            registrationOpen: true,
            status: COURSE_STATUS.REGISTRATION_OPEN,
        });
        const res = await request(app)
            .post('/api/v1/enrollments')
            .set('Authorization', `Bearer ${adultLogin.body.data.accessToken}`)
            .send({
                courseId: cCourse._id.toString(),
                schoolId: schoolId.toString(),
                categoryCode: 'C',
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/متطلبات/);
    });

    it('traffic enterResult practical fail preserves final_theory_passed', async () => {
        const adult = await User.findOne({ email: 'adult@drivehub.local' });
        const enrollment = await Enrollment.create({
            userId: adult._id,
            courseId,
            schoolId,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
        });

        await trafficService.enterResult(studentId, {
            studentId: adult._id,
            enrollmentId: enrollment._id,
            examType: 'practical',
            passed: false,
        });

        const updated = await Enrollment.findById(enrollment._id);
        expect(updated.status).toBe(ENROLLMENT_STATUS.FINAL_THEORY_PASSED);
        expect(updated.retakeScope).toBeTruthy();
    });

    it('GET /rosters/verify/:token returns roster payload', async () => {
        const roster = await StudentRoster.create({
            schoolId,
            courseId,
            studentIds: [studentId],
            enrollmentIds: [],
            submittedBy: studentId,
            status: 'submitted',
            verificationToken: 'a'.repeat(32),
            qrPayload: { schoolName: 'مدرسة فجوات', studentCount: 1 },
            submittedAt: new Date(),
        });

        const res = await request(app).get(`/api/v1/rosters/verify/${roster.verificationToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.verification.school?.name).toBe('مدرسة فجوات');
    });

    it('practice session start requires active enrollment', async () => {
        const adultLogin = await request(app).post('/api/v1/auth/login').send({
            email: 'adult@drivehub.local',
            password: strongPassword,
        });
        const res = await request(app)
            .post('/api/v1/student/practice/start')
            .set('Authorization', `Bearer ${adultLogin.body.data.accessToken}`)
            .send({ categoryCode: 'B' });
        expect([400, 403]).toContain(res.status);
    });
});
