const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');
const {
    User,
    UserRole,
    DocumentUpload,
    DocumentAccessLog,
    DrivingSchool,
    TrainingCourse,
    Enrollment,
    StudentStatistics,
    DrivingLicenseRecord,
    StudentRoster,
} = require('../../src/models');
const passwordService = require('../../src/utils/passwordService');
const { encrypt, decrypt } = require('../../src/utils/encryption');
const { ROLES } = require('../../src/constants/roles');
const { ENROLLMENT_STATUS } = require('../../src/constants/enrollmentStatus');
const { COURSE_STATUS } = require('../../src/constants/courseStatus');

let mongoServer;
let app;
let studentToken;
let studentId;
let managerToken;
let adminToken;
let schoolId;
let enrollmentId;
let courseId;

const strongPassword = 'SecurePass1!';

const jpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();

    const student = await User.create({
        name: 'Doc Student',
        email: 'docstudent@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.REGISTERED },
    });
    studentId = student._id;
    await UserRole.create({ userId: student._id, role: ROLES.REGISTERED });

    const manager = await User.create({
        name: 'Doc Manager',
        email: 'docmanager@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.MANAGER },
    });
    await UserRole.create({ userId: manager._id, role: ROLES.MANAGER });

    const admin = await User.create({
        name: 'Doc Admin',
        email: 'docadmin@drivehub.local',
        password: await passwordService.hashPassword(strongPassword),
        activeContext: { role: ROLES.ADMIN },
    });
    await UserRole.create({ userId: admin._id, role: ROLES.ADMIN });

    const school = await DrivingSchool.create({
        name: 'مدرسة أمان',
        address: 'دمشق',
        lat: 33.5,
        lng: 36.2,
        licenses: ['B'],
        status: 'active',
    });
    schoolId = school._id;

    await User.findByIdAndUpdate(manager._id, {
        activeContext: { role: ROLES.MANAGER, schoolId },
    });

    const course = await TrainingCourse.create({
        schoolId,
        categoryCode: 'B',
        status: COURSE_STATUS.REGISTRATION_OPEN,
        maxStudents: 20,
        launchDate: new Date(),
    });
    courseId = course._id;

    const enrollment = await Enrollment.create({
        userId: studentId,
        courseId: course._id,
        schoolId,
        categoryCode: 'B',
        status: ENROLLMENT_STATUS.UNDER_REVIEW,
    });
    enrollmentId = enrollment._id;

    const loginStudent = await request(app).post('/api/v1/auth/login').send({
        email: 'docstudent@drivehub.local',
        password: strongPassword,
    });
    studentToken = loginStudent.body.data.accessToken;

    const loginManager = await request(app).post('/api/v1/auth/login').send({
        email: 'docmanager@drivehub.local',
        password: strongPassword,
        portal: 'school',
    });
    managerToken = loginManager.body.data.accessToken;

    const loginAdmin = await request(app).post('/api/v1/auth/login').send({
        email: 'docadmin@drivehub.local',
        password: strongPassword,
        portal: 'admin',
    });
    adminToken = loginAdmin.body.data.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Document security', () => {
    it('stores uploads with AES encryption (not plain base64)', async () => {
        const res = await request(app)
            .post('/api/v1/documents')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('type', 'national_id')
            .attach('file', jpegBuffer, { filename: 'id.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(201);
        const docId = res.body.data.document._id;

        const stored = await DocumentUpload.findById(docId).select('+encryptedPath').lean();
        const plainBase64 = jpegBuffer.toString('base64');
        expect(stored.encryptedPath).not.toBe(plainBase64);
        expect(decrypt(stored.encryptedPath)).toBe(plainBase64);
    });

    it('rejects files with mismatched magic bytes', async () => {
        const res = await request(app)
            .post('/api/v1/documents')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('type', 'national_id')
            .attach('file', fakeExeBuffer, { filename: 'evil.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/محتوى الملف|نوع الملف/);
    });

    it('denies unauthenticated document access', async () => {
        const doc = await DocumentUpload.create({
            userId: studentId,
            type: 'national_id',
            encryptedPath: encrypt('dGVzdA=='),
            mime: 'image/jpeg',
            originalName: 'id.jpg',
            size: 4,
        });

        const res = await request(app).get(`/api/v1/documents/${doc._id}`);
        expect(res.status).toBe(401);
    });

    it('creates audit log on view and download', async () => {
        const doc = await DocumentUpload.create({
            userId: studentId,
            type: 'national_id',
            encryptedPath: encrypt(jpegBuffer.toString('base64')),
            mime: 'image/jpeg',
            originalName: 'id.jpg',
            size: jpegBuffer.length,
        });

        await request(app)
            .get(`/api/v1/documents/${doc._id}`)
            .set('Authorization', `Bearer ${studentToken}`);

        await request(app)
            .get(`/api/v1/documents/${doc._id}/download`)
            .set('Authorization', `Bearer ${studentToken}`);

        const logs = await DocumentAccessLog.find({ documentId: doc._id }).sort({ at: 1 }).lean();
        expect(logs).toHaveLength(2);
        expect(logs[0].action).toBe('view');
        expect(logs[1].action).toBe('download');
        expect(String(logs[0].userId)).toBe(String(studentId));
    });

    it('allows manager to list enrollment documents for verification', async () => {
        await DocumentUpload.create({
            userId: studentId,
            type: 'national_id',
            encryptedPath: encrypt(jpegBuffer.toString('base64')),
            mime: 'image/jpeg',
            originalName: 'id.jpg',
            size: jpegBuffer.length,
        });

        const res = await request(app)
            .get(`/api/v1/documents/enrollment/${enrollmentId}`)
            .set('Authorization', `Bearer ${managerToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.documents.length).toBeGreaterThanOrEqual(1);
    });

    it('denies other students from accessing foreign documents', async () => {
        const other = await User.create({
            name: 'Other',
            email: 'otherdoc@drivehub.local',
            password: await passwordService.hashPassword(strongPassword),
            activeContext: { role: ROLES.REGISTERED },
        });
        await UserRole.create({ userId: other._id, role: ROLES.REGISTERED });
        const otherLogin = await request(app).post('/api/v1/auth/login').send({
            email: 'otherdoc@drivehub.local',
            password: strongPassword,
        });

        const doc = await DocumentUpload.create({
            userId: studentId,
            type: 'national_id',
            encryptedPath: encrypt(jpegBuffer.toString('base64')),
            mime: 'image/jpeg',
            originalName: 'id.jpg',
            size: jpegBuffer.length,
        });

        const res = await request(app)
            .get(`/api/v1/documents/${doc._id}`)
            .set('Authorization', `Bearer ${otherLogin.body.data.accessToken}`);

        expect(res.status).toBe(403);
    });
});

describe('Report verification (anti-forgery)', () => {
    it('GET /verify/statistics/:token returns statistics payload', async () => {
        const stats = await StudentStatistics.create({
            userId: studentId,
            enrollmentId,
            progressPercent: 55,
            verificationToken: 'a'.repeat(32),
            qrPayload: { type: 'student_statistics' },
        });

        const res = await request(app).get(`/api/v1/verify/statistics/${stats.verificationToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.verification.valid).toBe(true);
        expect(res.body.data.verification.type).toBe('student_statistics');
    });

    it('GET /verify/certificate/:token returns certificate payload', async () => {
        const record = await DrivingLicenseRecord.create({
            userId: studentId,
            categoryCode: 'B',
            certificateNumber: 'CERT-001',
            issueDate: new Date(),
            verificationToken: 'b'.repeat(32),
            qrPayload: { type: 'driving_license' },
        });

        const res = await request(app).get(`/api/v1/verify/certificate/${record.verificationToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.verification.valid).toBe(true);
    });

    it('GET /verify/roster/:token returns roster payload', async () => {
        const roster = await StudentRoster.create({
            schoolId,
            courseId,
            studentIds: [studentId],
            enrollmentIds: [enrollmentId],
            status: 'submitted',
            submittedAt: new Date(),
            submittedBy: studentId,
            verificationToken: 'c'.repeat(32),
            qrPayload: { type: 'student_roster' },
        });

        const res = await request(app).get(`/api/v1/verify/roster/${roster.verificationToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.verification.valid).toBe(true);
    });
});
