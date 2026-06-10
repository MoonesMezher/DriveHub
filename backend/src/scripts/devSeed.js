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
} = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ROLES } = require('../constants/roles');
const passwordService = require('../utils/passwordService');
const { contentSeed } = require('./contentSeed');

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

    const primarySchool = schoolDocs[0];
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
        name: 'موظف مرور',
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

    await disconnectDatabase();
    await contentSeed({ schoolId: primarySchool._id, managerId: manager._id });

    console.log('✓ devSeed complete');
    console.log(`  Schools: ${schoolDocs.length}`);
    console.log(`  Pricing: B = 500,000 SYP`);
    console.log(`  Course: ${course._id} @ ${primarySchool.name}`);
    console.log('  Demo accounts (password: StudentPass1!):');
    console.log('    student@drivehub.local       — registered');
    console.log('    activestudent@drivehub.local — active student');
    console.log('    manager@drivehub.local       — school manager');
    console.log('    coach@drivehub.local         — coach');
    console.log('    traffic@drivehub.local       — traffic officer');
};

if (require.main === module) {
    devSeed().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { devSeed };
