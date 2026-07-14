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
    LicenseCategory,
    QuestionBank,
    PracticeExam,
    PracticeExamSession,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { ROLES } = require('../../src/constants/roles');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');

let mongoServer;
let app;
let token;
let userId;
let schoolId;
let enrollmentId;

const strongPassword = 'SecurePass1!';

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    await LicenseCategory.create({ code: 'B', name: 'خصوصي', minAge: 18, order: 1 });

    const user = await User.create({
        name: 'Practice Session Student',
        email: 'practice-session@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        profileData: { dateOfBirth: '2000-01-01' },
        activeContext: { role: ROLES.STUDENT },
    });
    userId = user._id;
    await UserRole.create({ userId, role: ROLES.STUDENT });

    const school = await DrivingSchool.create({
        name: 'مدرسة المحاولات',
        address: 'دمشق',
        lat: 33.5,
        lng: 36.2,
        licenses: ['B'],
        status: 'active',
    });
    schoolId = school._id;

    const course = await TrainingCourse.create({
        schoolId,
        categoryCode: 'B',
        subTypeCode: 'B1',
        maxStudents: 30,
        registrationOpen: true,
    });

    const enrollment = await Enrollment.create({
        userId,
        schoolId,
        courseId: course._id,
        categoryCode: 'B',
        subTypeCode: 'B1',
        status: ENROLLMENT_STATUS.ACTIVE,
    });
    enrollmentId = enrollment._id;

    await QuestionBank.create({
        schoolId,
        addedBy: userId,
        title: 'بنك تجريبي',
        categoryCode: 'B',
        subTypeCode: 'B1',
        status: 'active',
        questions: Array.from({ length: 8 }).map((_, idx) => ({
            text: `سؤال ${idx + 1}`,
            type: 'mcq',
            options: [
                { key: 'a', text: 'أ' },
                { key: 'b', text: 'ب' },
                { key: 'c', text: 'ج' },
            ],
            correctAnswer: 'a',
            explanation: 'تفسير',
            status: 'active',
        })),
    });

    const login = await request(app).post('/api/v1/auth/login').send({
        email: 'practice-session@drivehub.local',
        password: strongPassword,
    });
    token = login.body.data.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('practice session accounting', () => {
    it('finalizes previous active session when starting a new one', async () => {
        const firstStart = await auth(
            request(app).post('/api/v1/student/practice/start').send({
                enrollmentId: enrollmentId.toString(),
                questionCount: 5,
                durationSeconds: 600,
            }),
        );
        expect(firstStart.status).toBe(201);

        const secondStart = await auth(
            request(app).post('/api/v1/student/practice/start').send({
                enrollmentId: enrollmentId.toString(),
                questionCount: 5,
                durationSeconds: 600,
            }),
        );
        expect(secondStart.status).toBe(201);

        const firstSession = await PracticeExamSession.findById(firstStart.body.data.sessionId).lean();
        expect(firstSession.status).toBe('submitted');
        expect(firstSession.practiceExamId).toBeTruthy();

        const exams = await PracticeExam.find({ userId }).lean();
        expect(exams.length).toBe(1);
        expect(exams[0].attempt).toBe(1);
    });
});
