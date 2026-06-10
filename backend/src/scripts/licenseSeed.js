const config = require('../config');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { LicenseCategory, LicenseSubType } = require('../models');

const CATEGORIES = [
    { code: 'B', name: 'خصوصي', briefDesc: 'سيارات خاصة', minAge: 18, order: 1 },
    { code: 'C', name: 'عمومي صغير', briefDesc: 'حتى 10 ركاب', minAge: 21, prerequisites: ['B'], order: 2 },
    { code: 'D1', name: 'عمومي متوسط', briefDesc: 'حتى 24 راكب', minAge: 23, prerequisites: ['C'], order: 3 },
    { code: 'D2', name: 'عمومي كبير', briefDesc: 'باصات وشاحنات', minAge: 25, prerequisites: ['D1'], order: 4 },
    { code: 'A', name: 'دراجة نارية', briefDesc: 'دراجات نارية', minAge: 18, order: 5 },
    { code: 'H', name: 'آليات زراعية', briefDesc: 'آليات زراعية', minAge: 18, order: 6 },
    { code: 'W', name: 'ذوي احتياجات', briefDesc: 'تقرير طبي مطلوب', minAge: 18, order: 7 },
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

module.exports = { licenseSeed };
