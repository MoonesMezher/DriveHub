const config = require('../config');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { LicenseCategory, LicenseSubType } = require('../models');
const { normalizePrerequisites } = require('../helpers/licensePrerequisite.helper');

const LICENSE_PREREQ = (items) => normalizePrerequisites(items);

const CATEGORIES = [
    {
        code: 'B',
        name: 'غير تجاري',
        briefDesc: 'غير تجاري — حتى 8 ركاب',
        fullDesc: 'رخصة غير تجارية مخصصة لقيادة السيارات الخاصة والكرافانات بعدد ركاب لا يتجاوز 8 ركاب.',
        requirementsIntro: 'متطلبات رخصة B (غير تجارية)',
        minAge: 18,
        vehicleTypes: 'سيارات خاصة وكرافان حتى 8 ركاب',
        order: 1,
    },
    {
        code: 'C',
        name: 'فئة C',
        briefDesc: 'بعد B لثلاث سنوات',
        fullDesc: 'فئة C تتطلب امتلاك رخصة B لمدة 3 سنوات على الأقل، وتغطي مركبات حتى 10 ركاب أو حمولة حتى 4 أطنان.',
        requirementsIntro: 'متطلبات رخصة C',
        minAge: 21,
        prerequisites: LICENSE_PREREQ([
            { label: 'امتلاك رخصة B لمدة 3 سنوات', code: 'B', isRequired: true, type: 'license' },
        ]),
        vehicleTypes: 'مركبات حتى 10 ركاب أو حمولة حتى 4 أطنان',
        order: 2,
    },
    {
        code: 'D1',
        name: 'فئة D1',
        briefDesc: 'بعد C لسنتين',
        fullDesc: 'فئة D1 تتطلب امتلاك رخصة C لمدة سنتين على الأقل، وتغطي مركبات حتى 24 راكباً أو حمولة حتى 11 طناً.',
        requirementsIntro: 'متطلبات رخصة D1',
        minAge: 23,
        prerequisites: LICENSE_PREREQ([
            { label: 'امتلاك رخصة C لمدة سنتين', code: 'C', isRequired: true, type: 'license' },
        ]),
        vehicleTypes: 'مركبات حتى 24 راكباً أو حمولة حتى 11 طناً',
        order: 3,
    },
    {
        code: 'D2',
        name: 'فئة D2',
        briefDesc: 'باصات وشاحنات',
        fullDesc: 'فئة D2 تتطلب امتلاك رخصة D1 لمدة سنتين على الأقل، وتغطي قيادة الباصات والشاحنات.',
        requirementsIntro: 'متطلبات رخصة D2',
        minAge: 25,
        prerequisites: LICENSE_PREREQ([
            { label: 'امتلاك رخصة D1 لمدة سنتين', code: 'D1', isRequired: true, type: 'license' },
        ]),
        vehicleTypes: 'باصات وشاحنات',
        order: 4,
    },
    {
        code: 'A',
        name: 'فئة A',
        briefDesc: 'دراجات نارية — فحص خاص',
        fullDesc: 'فئة A مخصصة للدراجات النارية وتتطلب اجتياز فحص خاص للدراجات النارية.',
        requirementsIntro: 'متطلبات رخصة A',
        minAge: 18,
        prerequisites: LICENSE_PREREQ([
            { label: 'اجتياز فحص خاص بالدراجات النارية', type: 'basic', isRequired: true },
        ]),
        vehicleTypes: 'دراجات نارية',
        order: 5,
    },
    {
        code: 'H',
        name: 'فئة H',
        briefDesc: 'للأغراض المخصصة',
        fullDesc: 'فئة H مخصصة للأغراض الخاصة بقيادة الآليات الزراعية.',
        requirementsIntro: 'متطلبات رخصة H',
        minAge: 18,
        prerequisites: LICENSE_PREREQ([
            { label: 'ترخيص لغرض مخصص (آليات زراعية)', type: 'basic', isRequired: true },
        ]),
        vehicleTypes: 'الآليات الزراعية',
        order: 6,
    },
    {
        code: 'W',
        name: 'فئة W',
        briefDesc: 'ذوو الاحتياجات الخاصة',
        fullDesc: 'فئة W مخصصة لقيادة مركبات ذوي الاحتياجات الخاصة وتتطلب تقريراً طبياً معتمداً.',
        requirementsIntro: 'متطلبات رخصة W',
        minAge: 18,
        prerequisites: LICENSE_PREREQ([
            { label: 'تقرير طبي معتمد', type: 'medical', isRequired: true },
        ]),
        vehicleTypes: 'مركبات ذوي الاحتياجات الخاصة',
        order: 7,
    },
];

const SUB_TYPES = [
    { parentCode: 'B', subCode: 'B1', name: 'عادي (يدوي)', transmissionType: 'manual' },
    { parentCode: 'B', subCode: 'B2', name: 'أوتوماتيك', transmissionType: 'automatic' },
];

const licenseSeed = async () => {
    await connectDatabase();

    for (const cat of CATEGORIES) {
        await LicenseCategory.findOneAndUpdate({ code: cat.code }, cat, { upsert: true, new: true });
    }

    for (const sub of SUB_TYPES) {
        await LicenseSubType.findOneAndUpdate(
            { parentCode: sub.parentCode, subCode: sub.subCode },
            sub,
            { upsert: true, new: true },
        );
    }

    console.log(`Seeded ${CATEGORIES.length} license categories and ${SUB_TYPES.length} sub-types`);
    await disconnectDatabase();
};

if (require.main === module) {
    licenseSeed().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { licenseSeed, CATEGORIES };
