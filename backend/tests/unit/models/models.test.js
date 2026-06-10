const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
    User,
    Enrollment,
    LicenseCategory,
    LicenseSubType,
    Payment,
    Notification,
    WaitingList,
    EnrollmentArchive,
} = require('../../../src/models');
const { ENROLLMENT_STATUS } = require('../../../src/constants/enrollmentStatus');
const { NOTIFICATION_TYPES } = require('../../../src/constants/notificationTypes');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Database models', () => {
    it('exports all planned model collections', () => {
        const models = require('../../../src/models');
        expect(Object.keys(models).length).toBeGreaterThanOrEqual(35);
    });

    it('enforces one pending enrollment per user', async () => {
        await Enrollment.syncIndexes();

        const user = await User.create({
            name: 'Pending User',
            email: 'pending@drivehub.local',
            password: 'hashed',
        });

        await Enrollment.create({
            userId: user._id,
            courseId: new mongoose.Types.ObjectId(),
            schoolId: new mongoose.Types.ObjectId(),
            categoryCode: 'B',
            status: ENROLLMENT_STATUS.SUBMITTED,
        });

        await expect(
            Enrollment.create({
                userId: user._id,
                courseId: new mongoose.Types.ObjectId(),
                schoolId: new mongoose.Types.ObjectId(),
                categoryCode: 'B',
                status: ENROLLMENT_STATUS.UNDER_REVIEW,
            })
        ).rejects.toThrow(/duplicate key/i);
    });

    it('stores license categories and B sub-types', async () => {
        await LicenseCategory.create({
            code: 'B',
            name: 'خصوصي',
            minAge: 18,
        });

        const sub = await LicenseSubType.create({
            parentCode: 'B',
            subCode: 'B1',
            name: 'عادي',
            transmissionType: 'manual',
        });

        expect(sub.subCode).toBe('B1');
    });

    it('creates payment with school/platform split fields', async () => {
        const payment = await Payment.create({
            enrollmentId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            schoolId: new mongoose.Types.ObjectId(),
            amount: 100000,
            schoolShare: 98000,
            platformShare: 2000,
            status: 'completed',
            paidAt: new Date(),
        });

        expect(payment.platformShare).toBe(2000);
    });

    it('persists notifications with type enum', async () => {
        const note = await Notification.create({
            userId: new mongoose.Types.ObjectId(),
            type: NOTIFICATION_TYPES.COURSE_LAUNCH,
            title: 'انطلاق الدورة',
            message: 'ستنطلق دورتك قريباً',
        });

        expect(note.read).toBe(false);
    });

    it('supports waiting list and enrollment archive', async () => {
        const wait = await WaitingList.create({
            courseId: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            categoryCode: 'B',
            status: 'waiting',
        });

        const archive = await EnrollmentArchive.create({
            userId: wait.userId,
            enrollmentId: new mongoose.Types.ObjectId(),
            schoolId: new mongoose.Types.ObjectId(),
            categoryCode: 'B',
            preservedData: { practiceScores: [80, 90] },
        });

        expect(wait.status).toBe('waiting');
        expect(archive.preservedData.practiceScores).toHaveLength(2);
    });
});
