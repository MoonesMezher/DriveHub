const config = require('../config');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const {
    DrivingSchool,
    TrainingCourse,
    PlatformPricing,
    User,
    UserRole,
    Instructor,
    Enrollment,
    Payment,
    LicenseCategory,
    LicenseSubType,
    SchoolApplication,
    AuditLog,
    WalletTransaction,
    ContentUnlockMode,
    Ad,
} = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ROLES } = require('../constants/roles');
const passwordService = require('../utils/passwordService');
const { contentSeed } = require('./contentSeed');
const { ensureAdmin } = require('./adminSeed');
const settingsService = require('../services/settings.service');
const { CATEGORIES: LICENSE_CATEGORIES } = require('./licenseSeed');

const DEMO_PASSWORD = 'StudentPass1!';
const B_PRICE = 500000;
const C_PRICE = 750000;
const COMMISSION = Number(config.platform?.commission) || 0.02;

const LICENSE_SUB_TYPES = [
    { parentCode: 'B', subCode: 'B1', name: 'عادي (يدوي)', transmissionType: 'manual' },
    { parentCode: 'B', subCode: 'B2', name: 'أوتوماتيك', transmissionType: 'automatic' },
];

const SCHOOLS = [
    {
        name: 'مدرسة النور لتعليم القيادة',
        description: 'مدرسة معتمدة في دمشق — رخصة B',
        phone: '0112345678',
        email: 'nour@drivehub.local',
        address: 'دمشق — المزة',
        governorate: 'دمشق',
        lat: 33.5138,
        lng: 36.2765,
        licenses: ['B', 'A'],
        vehiclesCount: 12,
        hasFemaleCoaches: true,
        preRegistrationEnabled: true,
    },
    {
        name: 'أكاديمية الأمان للقيادة',
        description: 'تدريب عملي ونظري — رخص B و C',
        phone: '0119876543',
        email: 'aman@drivehub.local',
        address: 'دمشق — كفرسوسة',
        governorate: 'دمشق',
        lat: 33.4850,
        lng: 36.2320,
        licenses: ['B', 'C'],
        vehiclesCount: 20,
        hasFemaleCoaches: false,
        preRegistrationEnabled: true,
    },
    {
        name: 'مركز الشام لتعليم السواقة',
        description: 'دورات شهرية منتظمة',
        phone: '0115551234',
        email: 'sham@drivehub.local',
        address: 'ريف دمشق — جديدة عرطوز',
        governorate: 'ريف دمشق',
        lat: 33.4500,
        lng: 36.0500,
        licenses: ['B'],
        vehiclesCount: 8,
        hasFemaleCoaches: true,
        preRegistrationEnabled: true,
    },
    {
        name: 'أكاديمية حلب للقيادة الآمنة',
        description: 'تدريب نظري وعملي في حلب',
        phone: '0212345678',
        email: 'aleppo@drivehub.local',
        address: 'حلب — العزيزية',
        governorate: 'حلب',
        lat: 36.2021,
        lng: 37.1343,
        licenses: ['B', 'C'],
        vehiclesCount: 15,
        hasFemaleCoaches: true,
        preRegistrationEnabled: true,
    },
    {
        name: 'مدرسة حمص لتعليم السواقة',
        description: 'دورات معتمدة لرخصة B',
        phone: '0312345678',
        email: 'homs@drivehub.local',
        address: 'حمص — الوعر',
        governorate: 'حمص',
        lat: 34.7268,
        lng: 36.7234,
        licenses: ['B'],
        vehiclesCount: 10,
        hasFemaleCoaches: false,
        preRegistrationEnabled: true,
    },
    {
        name: 'مركز اللاذقية للتدريب على القيادة',
        description: 'تدريب على الساحل السوري',
        phone: '0412345678',
        email: 'latakia@drivehub.local',
        address: 'اللاذقية — الصليبة',
        governorate: 'اللاذقية',
        lat: 35.5311,
        lng: 35.7908,
        licenses: ['B', 'A'],
        vehiclesCount: 9,
        hasFemaleCoaches: true,
        preRegistrationEnabled: true,
    },
    {
        name: 'مدرسة إدلب لتعليم القيادة',
        description: 'دورات معتمدة في شمال غرب سوريا',
        phone: '0234567890',
        email: 'idlib@drivehub.local',
        address: 'إدلب — وسط المدينة',
        governorate: 'إدلب',
        lat: 35.9306,
        lng: 36.6339,
        licenses: ['B'],
        vehiclesCount: 7,
        hasFemaleCoaches: true,
        preRegistrationEnabled: true,
    },
    {
        name: 'أكاديمية الرقة للقيادة',
        description: 'تدريب نظري وعملي على الفرات',
        phone: '0223456789',
        email: 'raqqa@drivehub.local',
        address: 'الرقة — التحلية',
        governorate: 'الرقة',
        lat: 35.9594,
        lng: 39.0024,
        licenses: ['B', 'C'],
        vehiclesCount: 11,
        hasFemaleCoaches: false,
        preRegistrationEnabled: true,
    },
    {
        name: 'مركز الحسكة لتعليم السواقة',
        description: 'خدمات تدريب في الجزيرة السورية',
        phone: '0523456789',
        email: 'hasakah@drivehub.local',
        address: 'الحسكة — المدينة',
        governorate: 'الحسكة',
        lat: 36.5073,
        lng: 40.7477,
        licenses: ['B'],
        vehiclesCount: 8,
        hasFemaleCoaches: true,
        preRegistrationEnabled: true,
    },
    {
        name: 'مدرسة تدمر لتعليم القيادة',
        description: 'تدريب في البادية السورية',
        phone: '0319876543',
        email: 'palmyra@drivehub.local',
        address: 'تدمر — وسط المدينة',
        governorate: 'حمص',
        lat: 34.5564,
        lng: 38.2839,
        licenses: ['B'],
        vehiclesCount: 6,
        hasFemaleCoaches: false,
        preRegistrationEnabled: true,
    },
];

const ensureUser = async ({
    email,
    name,
    password,
    phone,
    role,
    schoolId = null,
    licenseCategories = [],
    activeContext = null,
}) => {
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name,
            email,
            phone,
            password: await passwordService.hashPassword(password),
            activeContext: activeContext || { role, schoolId },
        });
    } else if (activeContext) {
        user.activeContext = activeContext;
        await user.save();
    }

    await UserRole.findOneAndUpdate(
        { userId: user._id, role, schoolId: schoolId || null },
        {
            userId: user._id,
            role,
            schoolId: schoolId || null,
            licenseCategories,
            status: 'active',
        },
        { upsert: true, new: true },
    );

    return user;
};

const creditWallet = async ({ userId, amount, adminId, note }) => {
    const creditAmount = Number(amount);
    if (!Number.isFinite(creditAmount) || creditAmount <= 0) return null;

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { walletBalance: creditAmount } },
        { new: true, runValidators: true },
    );
    if (!user) return null;

    await WalletTransaction.deleteMany({ userId, type: 'admin_credit', note: { $regex: /^SEED/ } });
    const transaction = await WalletTransaction.create({
        userId,
        type: 'admin_credit',
        amount: creditAmount,
        balanceAfter: user.walletBalance,
        adminId: adminId || null,
        note: note || 'SEED wallet credit',
    });

    return { balance: user.walletBalance, transaction };
};

const runDevSeed = async () => {
    // License catalog
    for (const cat of LICENSE_CATEGORIES) {
        await LicenseCategory.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
    }
    for (const sub of LICENSE_SUB_TYPES) {
        await LicenseSubType.findOneAndUpdate(
            { parentCode: sub.parentCode, subCode: sub.subCode },
            sub,
            { upsert: true, new: true },
        );
    }

    let adminUser = null;
    try {
        adminUser = await ensureAdmin();
    } catch (err) {
        console.warn(`⚠ Admin seed skipped (${err.message}). Run npm run seed:admin after setting ADMIN_* in .env`);
    }

    const schoolDocs = [];
    for (const school of SCHOOLS) {
        const doc = await DrivingSchool.findOneAndUpdate(
            { name: school.name },
            { ...school, status: 'active' },
            { upsert: true, new: true },
        );
        schoolDocs.push(doc);
    }

    await PlatformPricing.findOneAndUpdate(
        { categoryCode: 'B', subTypeCode: null },
        { categoryCode: 'B', fixedPrice: B_PRICE, currency: 'SYP', isActive: true },
        { upsert: true, new: true },
    );
    await PlatformPricing.findOneAndUpdate(
        { categoryCode: 'B', subTypeCode: 'B1' },
        { categoryCode: 'B', subTypeCode: 'B1', fixedPrice: B_PRICE, currency: 'SYP', isActive: true },
        { upsert: true, new: true },
    );
    await PlatformPricing.findOneAndUpdate(
        { categoryCode: 'B', subTypeCode: 'B2' },
        { categoryCode: 'B', subTypeCode: 'B2', fixedPrice: B_PRICE, currency: 'SYP', isActive: true },
        { upsert: true, new: true },
    );
    await PlatformPricing.findOneAndUpdate(
        { categoryCode: 'C', subTypeCode: null },
        { categoryCode: 'C', fixedPrice: C_PRICE, currency: 'SYP', isActive: true },
        { upsert: true, new: true },
    );

    const primarySchool = schoolDocs[0];
    const secondarySchool = schoolDocs[1];

    const course = await TrainingCourse.findOneAndUpdate(
        { schoolId: primarySchool._id, categoryCode: 'B', status: COURSE_STATUS.REGISTRATION_OPEN },
        {
            schoolId: primarySchool._id,
            categoryCode: 'B',
            subTypeCode: 'B1',
            maxStudents: 60,
            paidCount: 1,
            registrationOpen: true,
            status: COURSE_STATUS.REGISTRATION_OPEN,
            paymentDeadlineDays: 3,
        },
        { upsert: true, new: true },
    );

    await TrainingCourse.findOneAndUpdate(
        { schoolId: secondarySchool._id, categoryCode: 'C', status: COURSE_STATUS.REGISTRATION_OPEN },
        {
            schoolId: secondarySchool._id,
            categoryCode: 'C',
            maxStudents: 30,
            paidCount: 0,
            registrationOpen: true,
            status: COURSE_STATUS.REGISTRATION_OPEN,
            paymentDeadlineDays: 5,
        },
        { upsert: true, new: true },
    );

    const demoPassword = DEMO_PASSWORD;

    const registeredUser = await ensureUser({
        email: 'student@drivehub.local',
        name: 'مستخدم مسجّل',
        password: demoPassword,
        phone: '0944111222',
        role: ROLES.REGISTERED,
        activeContext: { role: ROLES.REGISTERED },
    });

    const manager = await ensureUser({
        email: 'manager@drivehub.local',
        name: 'مدير مدرسة النور',
        password: demoPassword,
        phone: '0944222333',
        role: ROLES.MANAGER,
        schoolId: primarySchool._id,
        activeContext: { role: ROLES.MANAGER, schoolId: primarySchool._id },
    });

    await ensureUser({
        email: 'manager2@drivehub.local',
        name: 'مدير أكاديمية الأمان',
        password: demoPassword,
        phone: '0944222444',
        role: ROLES.MANAGER,
        schoolId: secondarySchool._id,
        activeContext: { role: ROLES.MANAGER, schoolId: secondarySchool._id },
    });

    const coachUser = await ensureUser({
        email: 'coach@drivehub.local',
        name: 'مدرب أحمد',
        password: demoPassword,
        phone: '0944333444',
        role: ROLES.COACH,
        schoolId: primarySchool._id,
        licenseCategories: ['B'],
        activeContext: { role: ROLES.COACH, schoolId: primarySchool._id },
    });

    const femaleCoachUser = await ensureUser({
        email: 'coach2@drivehub.local',
        name: 'مدربة سارة',
        password: demoPassword,
        phone: '0944333555',
        role: ROLES.COACH,
        schoolId: primarySchool._id,
        licenseCategories: ['B'],
        activeContext: { role: ROLES.COACH, schoolId: primarySchool._id },
    });

    await Instructor.findOneAndUpdate(
        { userId: coachUser._id, schoolId: primarySchool._id },
        {
            userId: coachUser._id,
            schoolId: primarySchool._id,
            licenseCategories: ['B'],
            gender: 'male',
            isFemaleCoach: false,
            status: 'active',
        },
        { upsert: true, new: true },
    );

    await Instructor.findOneAndUpdate(
        { userId: femaleCoachUser._id, schoolId: primarySchool._id },
        {
            userId: femaleCoachUser._id,
            schoolId: primarySchool._id,
            licenseCategories: ['B'],
            gender: 'female',
            isFemaleCoach: true,
            status: 'active',
        },
        { upsert: true, new: true },
    );

    await ensureUser({
        email: 'traffic@drivehub.local',
        name: 'موظف مرور — وزارة النقل',
        password: demoPassword,
        phone: '0944555666',
        role: ROLES.TRAFFIC,
        activeContext: { role: ROLES.TRAFFIC },
    });

    const activeStudent = await ensureUser({
        email: 'activestudent@drivehub.local',
        name: 'طالب نشط',
        password: demoPassword,
        phone: '0944666777',
        role: ROLES.STUDENT,
        schoolId: primarySchool._id,
        licenseCategories: ['B'],
        activeContext: { role: ROLES.STUDENT, schoolId: primarySchool._id },
    });

    const platformShare = Math.round(B_PRICE * COMMISSION);
    const schoolShare = B_PRICE - platformShare;

    const enrollment = await Enrollment.findOneAndUpdate(
        { userId: activeStudent._id, schoolId: primarySchool._id, categoryCode: 'B' },
        {
            userId: activeStudent._id,
            courseId: course._id,
            schoolId: primarySchool._id,
            categoryCode: 'B',
            subTypeCode: 'B1',
            status: ENROLLMENT_STATUS.ACTIVE,
            paidAt: new Date(),
            prefersFemaleCoach: true,
            managerVisible: false,
        },
        { upsert: true, new: true },
    );

    await Payment.findOneAndUpdate(
        { enrollmentId: enrollment._id, type: 'initial', status: 'completed' },
        {
            enrollmentId: enrollment._id,
            userId: activeStudent._id,
            schoolId: primarySchool._id,
            amount: B_PRICE,
            schoolShare,
            platformShare,
            commissionRate: COMMISSION,
            type: 'initial',
            status: 'completed',
            paidAt: new Date(),
            gatewayRef: 'SEED-MANUAL',
        },
        { upsert: true, new: true },
    );

    await ContentUnlockMode.findOneAndUpdate(
        { userId: activeStudent._id, categoryCode: 'B' },
        {
            userId: activeStudent._id,
            categoryCode: 'B',
            enrollmentId: enrollment._id,
            mode: 'full',
            maxUnlockedPhase: 1,
            viewedContentIds: [],
            unlockedAt: new Date(),
        },
        { upsert: true, new: true },
    );

    // Wallet demo: registered user has credit to pay; active student keeps residual credit
    await creditWallet({
        userId: registeredUser._id,
        amount: B_PRICE + 100000,
        adminId: adminUser?._id,
        note: 'SEED credit — ready to enroll (B price + buffer)',
    });
    await creditWallet({
        userId: activeStudent._id,
        amount: 150000,
        adminId: adminUser?._id,
        note: 'SEED credit — residual after enrollment demo',
    });

    // Pending school application for admin compliance / CMS review demo
    await SchoolApplication.findOneAndUpdate(
        { email: 'pending-school@drivehub.local' },
        {
            applicantUserId: registeredUser._id,
            schoolName: 'مدرسة الأمل للقيادة',
            address: 'حلب — السليمانية',
            governorate: 'حلب',
            lat: 36.2021,
            lng: 37.1343,
            phone: '0212345678',
            email: 'pending-school@drivehub.local',
            licenses: ['B'],
            bankAccount: 'SY00SEEDBANK123456789',
            status: 'pending',
            documents: [],
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    );

    if (adminUser?._id) {
        await Ad.findOneAndUpdate(
            { title: 'انضم إلى DriveHub — عرض تجريبي', createdBy: adminUser._id },
            {
                title: 'انضم إلى DriveHub — عرض تجريبي',
                imageUrl: '/images/driving/driving-lesson.jpg',
                link: '/schools',
                placement: 'home',
                status: 'active',
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                createdBy: adminUser._id,
                order: 1,
            },
            { upsert: true, new: true },
        );
    }

    await settingsService.seedPrivacy();
    await contentSeed({ schoolId: primarySchool._id, managerId: manager._id });

    const seedActorId = adminUser?._id || manager._id;

    await AuditLog.deleteMany({ action: { $regex: /^seed\./ } });
    const seedAuditEntries = [
        { action: 'seed.admin.login', userId: seedActorId, method: 'POST', path: '/api/v1/auth/login', ip: '127.0.0.1' },
        { action: 'admin.school.create', userId: seedActorId, entityType: 'DrivingSchool', entityId: primarySchool._id, method: 'POST', path: '/api/v1/admin/schools', ip: '127.0.0.1', metadata: { schoolName: primarySchool.name } },
        { action: 'manager.course.create', userId: manager._id, entityType: 'TrainingCourse', entityId: course._id, method: 'POST', path: '/api/v1/manager/courses', ip: '127.0.0.1' },
        { action: 'manager.enrollment.accept', userId: manager._id, entityType: 'Enrollment', entityId: enrollment._id, method: 'POST', path: `/api/v1/manager/enrollments/${enrollment._id}/accept`, ip: '127.0.0.1' },
        { action: 'admin.wallet.credit', userId: seedActorId, entityType: 'User', entityId: registeredUser._id, method: 'POST', path: `/api/v1/admin/users/${registeredUser._id}/wallet/credit`, ip: '127.0.0.1', metadata: { note: 'SEED' } },
        { action: 'admin.traffic.distribute', userId: seedActorId, method: 'POST', path: '/api/v1/admin/traffic/distribute', ip: '127.0.0.1', metadata: { note: 'Sample audit entry from seed' } },
    ];
    for (const [index, entry] of seedAuditEntries.entries()) {
        await AuditLog.create({ ...entry, at: new Date(Date.now() - index * 3600000) });
    }

    return {
        schoolCount: schoolDocs.length,
        courseId: course._id,
        primarySchoolName: primarySchool.name,
        adminEmail: adminUser?.email || null,
    };
};

const printSeedSummary = (result) => {
    console.log('✓ devSeed complete');
    console.log(`  Schools: ${result.schoolCount}`);
    console.log(`  Licenses: ${LICENSE_CATEGORIES.length} categories`);
    console.log(`  Pricing: B = ${B_PRICE.toLocaleString('en-US')} SYP, C = ${C_PRICE.toLocaleString('en-US')} SYP (commission ${COMMISSION * 100}%)`);
    console.log(`  Course: ${result.courseId} @ ${result.primarySchoolName}`);
    console.log('  Wallets: student@… credited for enrollment; activestudent@… residual credit');
    console.log('  Coaches: coach@… (male) + coach2@… (female) Instructor records');
    console.log('  Content: theory, videos, FAQ, requirements, testimonials, question bank');
    console.log('  Compliance sample: pending school application (مدرسة الأمل)');
    console.log('  Demo accounts (see LOGIN.md):');
    console.log(`    student@drivehub.local        — registered  (${DEMO_PASSWORD})`);
    console.log(`    activestudent@drivehub.local  — active student`);
    console.log(`    manager@drivehub.local        — school manager`);
    console.log(`    coach@drivehub.local          — male coach`);
    console.log(`    coach2@drivehub.local         — female coach`);
    console.log(`    traffic@drivehub.local        — traffic/ministry`);
    if (result.adminEmail) {
        console.log(`    ${result.adminEmail}        — admin (from ADMIN_* env)`);
    } else {
        console.log('  Admin: run npm run seed:admin with ADMIN_EMAIL / ADMIN_PASSWORD');
    }
};

const devSeed = async () => {
    await connectDatabase();
    try {
        const result = await runDevSeed();
        printSeedSummary(result);
    } finally {
        await disconnectDatabase();
    }
};

if (require.main === module) {
    devSeed().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { devSeed, runDevSeed, printSeedSummary, DEMO_PASSWORD };
