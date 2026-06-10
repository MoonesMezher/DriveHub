const { body } = require('express-validator');
const msg = require('./messages');
const { requiredString, optionalString, requiredInt, stringArrayBody } = require('./chains');

const upsertCategoryRules = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage(msg.required('رمز الفئة'))
        .isLength({ min: 1, max: 3 })
        .withMessage('رمز الفئة غير صالح'),
    requiredString('name', 'اسم الفئة', { min: 2, max: 100 }),
    optionalString('briefDesc', 'الوصف المختصر', { max: 500 }),
    optionalString('fullDesc', 'الوصف الكامل', { max: 5000 }),
    requiredInt('minAge', 'الحد الأدنى للعمر', { min: 16, max: 80 }),
    stringArrayBody('prerequisites', 'المتطلبات السابقة', { max: 10 }),
    optionalString('vehicleTypes', 'أنواع المركبات', { max: 300 }),
    body('order').optional().isInt({ min: 0, max: 100 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

const upsertSubTypeRules = [
    body('parentCode')
        .trim()
        .notEmpty()
        .withMessage(msg.required('الفئة الأم'))
        .isLength({ min: 1, max: 3 }),
    body('subCode')
        .trim()
        .notEmpty()
        .withMessage(msg.required('الرمز الفرعي'))
        .matches(/^[A-Z]\d$/)
        .withMessage('الرمز الفرعي غير صالح (مثال: B1, B2)'),
    requiredString('name', 'اسم النوع الفرعي', { min: 2, max: 100 }),
    body('transmissionType')
        .notEmpty()
        .withMessage(msg.required('نوع ناقل الحركة'))
        .isIn(['manual', 'automatic'])
        .withMessage(msg.mustBeIn('نوع ناقل الحركة', ['manual', 'automatic'])),
    optionalString('description', 'الوصف', { max: 500 }),
];

module.exports = {
    upsertCategoryRules,
    upsertSubTypeRules,
};
