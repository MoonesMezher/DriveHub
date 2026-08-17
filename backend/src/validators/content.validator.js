const { body } = require('express-validator');
const msg = require('./messages');
const {
    mongoIdBody,
    optionalMongoIdBody,
    requiredString,
    optionalString,
    requiredLicenseCode,
    optionalLicenseSubCode,
    requiredInt,
    optionalInt,
    requiredEnumBody,
    optionalEnumBody,
    optionalMediaRef,
} = require('./chains');

const questionOptionRules = [
    body('options').isArray({ min: 2, max: 6 }).withMessage('يجب توفير 2–6 خيارات للسؤال'),
    body('options.*.key').trim().notEmpty().withMessage('مفتاح الخيار مطلوب'),
    body('options.*.text').trim().notEmpty().withMessage('نص الخيار مطلوب'),
];

const createQuestionRules = [
    requiredString('text', 'نص السؤال', { min: 5, max: 2000 }),
    requiredEnumBody('type', 'نوع السؤال', ['mcq', 'true_false']),
    ...questionOptionRules,
    requiredString('correctAnswer', 'الإجابة الصحيحة', { min: 1, max: 500 }),
    optionalString('explanation', 'التفسير', { max: 2000 }),
    optionalEnumBody('difficulty', 'الصعوبة', ['easy', 'medium', 'hard']),
    optionalMediaRef('imageUrl', 'صورة السؤال'),
];

const updateQuestionRules = [
    requiredString('text', 'نص السؤال', { min: 5, max: 2000 }),
    requiredEnumBody('type', 'نوع السؤال', ['mcq', 'true_false']),
    ...questionOptionRules,
    requiredString('correctAnswer', 'الإجابة الصحيحة', { min: 1, max: 500 }),
    optionalString('explanation', 'التفسير', { max: 2000 }),
    optionalEnumBody('difficulty', 'الصعوبة', ['easy', 'medium', 'hard']),
    optionalMediaRef('imageUrl', 'صورة السؤال'),
    optionalEnumBody('status', 'حالة السؤال', ['active', 'archived']),
];

const createQuestionBankRules = [
    mongoIdBody('schoolId', 'المدرسة'),
    requiredString('title', 'عنوان بنك الأسئلة', { min: 2, max: 200 }),
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    body('questions').optional().isArray({ max: 500 }).withMessage('عدد الأسئلة كبير جداً'),
];

const questionEditRequestRules = [
    mongoIdBody('questionBankId', 'بنك الأسئلة'),
    mongoIdBody('questionId', 'السؤال'),
    body('proposedChanges').isObject().withMessage('التعديلات المقترحة غير صالحة'),
];

const trainingDataEditRules = [
    requiredEnumBody('contentType', 'نوع المحتوى', ['theory', 'shared', 'specific', 'video']),
    mongoIdBody('contentId', 'المحتوى'),
    body('proposedChanges').isObject().withMessage('التعديلات المقترحة غير صالحة'),
];

const coachContentListRules = [
    requiredEnumBody('contentType', 'نوع المحتوى', ['theory', 'shared', 'specific', 'video']),
];

const reviewEditRequestRules = [
    requiredEnumBody('status', 'قرار المراجعة', ['approved', 'rejected']),
    optionalString('reviewNote', 'ملاحظة المراجعة', { max: 500 }),
];

const createTheoryContentRules = [
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    requiredInt('phase', 'المرحلة', { min: 1, max: 50 }),
    requiredString('title', 'العنوان', { min: 2, max: 300 }),
    requiredString('body', 'المحتوى', { min: 10, max: 50000 }),
    optionalInt('order', 'الترتيب', { min: 0, max: 1000 }),
    body('isSample').optional().isBoolean().withMessage(msg.mustBeBoolean('عينة مجانية')),
    body('sampleTier').optional().isIn(['partial', 'full']).withMessage(msg.mustBeIn('مستوى العينة', ['partial', 'full'])),
    optionalEnumBody('unlockMode', 'وضع الفتح', ['progressive', 'full']),
    optionalMediaRef('imageUrl', 'صورة المقال'),
];

const createSharedContentRules = [
    requiredEnumBody('section', 'القسم', ['signs', 'rules', 'safety']),
    requiredString('title', 'العنوان', { min: 2, max: 300 }),
    requiredString('body', 'المحتوى', { min: 10, max: 50000 }),
    optionalInt('order', 'الترتيب', { min: 0, max: 1000 }),
    optionalMediaRef('mediaUrl', 'صورة المحتوى'),
];

const createSpecificContentRules = [
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    requiredEnumBody('section', 'القسم', ['mechanics', 'vehicle_ops', 'maintenance']),
    requiredString('title', 'العنوان', { min: 2, max: 300 }),
    requiredString('body', 'المحتوى', { min: 10, max: 50000 }),
    optionalInt('order', 'الترتيب', { min: 0, max: 1000 }),
    optionalMediaRef('mediaUrl', 'صورة المحتوى'),
];

const createPracticalVideoRules = [
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    requiredInt('phase', 'المرحلة', { min: 1, max: 50 }),
    requiredString('title', 'العنوان', { min: 2, max: 300 }),
    requiredString('url', 'رابط الفيديو', { min: 5, max: 500 }),
    optionalInt('durationSeconds', 'مدة الفيديو بالثواني', { min: 1, max: 7200 }),
    optionalInt('order', 'الترتيب', { min: 0, max: 1000 }),
    optionalMediaRef('thumbnailUrl', 'صورة مصغّرة للفيديو'),
];

const contentUnlockRules = [
    requiredLicenseCode('categoryCode'),
    requiredEnumBody('mode', 'وضع الفتح', ['progressive', 'full']),
    optionalMongoIdBody('enrollmentId', 'طلب الاشتراك'),
];

module.exports = {
    createQuestionRules,
    updateQuestionRules,
    createQuestionBankRules,
    questionEditRequestRules,
    trainingDataEditRules,
    coachContentListRules,
    reviewEditRequestRules,
    createTheoryContentRules,
    createSharedContentRules,
    createSpecificContentRules,
    createPracticalVideoRules,
    contentUnlockRules,
};
