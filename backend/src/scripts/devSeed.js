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
} = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ROLES } = require('../constants/roles');
const passwordService = require('../utils/passwordService');
const { contentSeed } = require('./contentSeed');
const settingsService = require('../services/settings.service');

const LICENSE_CATEGORIES = [
    { code: 'B', name: 'خصوصي', briefDesc: 'سيارات خاصة', minAge: 18, order: 1 },
    { code: 'C', name: 'عمومي صغير', briefDesc: 'حتى 10 ركاب', minAge: 21, prerequisites: ['B'], order: 2 },
    { code: 'D1', name: 'عمومي متوسط', briefDesc: 'حتى 24 راكب', minAge: 23, prerequisites: ['C'], order: 3 },
    { code: 'D2', name: 'عمومي كبير', briefDesc: 'باصات وشاحنات', minAge: 25, prerequisites: ['D1'], order: 4 },
    { code: 'A', name: 'دراجة نارية', briefDesc: 'دراجات نارية', minAge: 18, order: 5 },
    { code: 'H', name: 'آليات زراعية', briefDesc: 'آليات زراعية', minAge: 18, order: 6 },
    { code: 'W', name: 'ذوي احتياجات', briefDesc: 'تقرير طبي مطلوب', minAge: 18, order: 7 },
];

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

const devSeed = async () => {
    await connectDatabase();

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
        { categoryCode: 'B', fixedPrice: 500000, currency: 'SYP', isActive: true },
        { upsert: true, new: true },
    );
    await PlatformPricing.findOneAndUpdate(
        { categoryCode: 'B', subTypeCode: 'B1' },
        { categoryCode: 'B', subTypeCode: 'B1', fixedPrice: 500000, currency: 'SYP', isActive: true },
        { upsert: true, new: true },
    );
    await PlatformPricing.findOneAndUpdate(
        { categoryCode: 'C', subTypeCode: null },
        { categoryCode: 'C', fixedPrice: 750000, currency: 'SYP', isActive: true },
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

    const demoPassword = 'StudentPass1!';

    await ensureUser({
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

    await ensureUser({
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
            amount: 500000,
            schoolShare: 450000,
            platformShare: 50000,
            commissionRate: 0.1,
            type: 'initial',
            status: 'completed',
            paidAt: new Date(),
            gatewayRef: 'SEED-MOCK',
        },
        { upsert: true, new: true },
    );

    // Pending school application for admin review demo
    await SchoolApplication.findOneAndUpdate(
        { email: 'pending-school@drivehub.local' },
        {
            schoolName: 'مدرسة الأمل للقيادة',
            address: 'حلب — السليمانية',
            governorate: 'حلب',
            lat: 36.2021,
            lng: 37.1343,
            phone: '0212345678',
            email: 'pending-school@drivehub.local',
            licenses: ['B'],
            status: 'pending',
            submittedAt: new Date(),
        },
        { upsert: true, new: true },
    );

    await settingsService.seedPrivacy();
    await contentSeed({ schoolId: primarySchool._id, managerId: manager._id });

    const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@drivehub.local' });
    const seedActorId = adminUser?._id || manager._id;

    await AuditLog.deleteMany({ action: { $regex: /^seed\./ } });
    const seedAuditEntries = [
        { action: 'seed.admin.login', userId: seedActorId, method: 'POST', path: '/api/v1/auth/login', ip: '127.0.0.1' },
        { action: 'admin.school.create', userId: seedActorId, entityType: 'DrivingSchool', entityId: primarySchool._id, method: 'POST', path: '/api/v1/admin/schools', ip: '127.0.0.1', metadata: { schoolName: primarySchool.name } },
        { action: 'manager.course.create', userId: manager._id, entityType: 'TrainingCourse', entityId: course._id, method: 'POST', path: '/api/v1/manager/courses', ip: '127.0.0.1' },
        { action: 'manager.enrollment.accept', userId: manager._id, entityType: 'Enrollment', entityId: enrollment._id, method: 'POST', path: `/api/v1/manager/enrollments/${enrollment._id}/accept`, ip: '127.0.0.1' },
        { action: 'admin.traffic.distribute', userId: seedActorId, method: 'POST', path: '/api/v1/admin/traffic/distribute', ip: '127.0.0.1', metadata: { note: 'Sample audit entry from seed' } },
    ];
    for (const [index, entry] of seedAuditEntries.entries()) {
        await AuditLog.create({ ...entry, at: new Date(Date.now() - index * 3600000) });
    }

    await disconnectDatabase();

    console.log('✓ devSeed complete');
    console.log(`  Schools: ${schoolDocs.length}`);
    console.log(`  Licenses: ${LICENSE_CATEGORIES.length} categories`);
    console.log(`  Pricing: B = 500,000 SYP, C = 750,000 SYP`);
    console.log(`  Course: ${course._id} @ ${primarySchool.name}`);
    console.log('  Demo accounts (password: StudentPass1!):');
    console.log('    student@drivehub.local        — registered');
    console.log('    activestudent@drivehub.local  — active student');
    console.log('    manager@drivehub.local        — school manager');
    console.log('    coach@drivehub.local          — coach (assign via email in manager portal)');
    console.log('    traffic@drivehub.local        — traffic/ministry officer');
    console.log('  Admin: run npm run seed:admin separately with ADMIN_EMAIL/ADMIN_PASSWORD');
};

if (require.main === module) {
    devSeed().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { devSeed };
