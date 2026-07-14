const { body } = require('express-validator');
const msg = require('./messages');
const { requiredString, optionalString, requiredInt } = require('./chains');
const { PREREQUISITE_TYPES } = require('../helpers/licensePrerequisite.helper');

const prerequisitesBody = body('prerequisites')
    .optional({ values: 'null' })
    .isArray({ max: 20 })
    .withMessage('المتطلبات يجب أن تكون مصفوفة')
    .custom((items) => {
        if (!Array.isArray(items)) return true;
        return items.every((item) => {
            if (typeof item === 'string') return item.trim().length > 0;
            if (!item || typeof item !== 'object') return false;
            if (!String(item.label || '').trim() && !String(item.code || '').trim()) return false;
            if (item.type && !PREREQUISITE_TYPES.includes(item.type)) return false;
            if (item.code && !/^[A-Z]\d?$/.test(String(item.code).trim().toUpperCase())) return false;
            return true;
        });
    })
    .withMessage('عنصر متطلب غير صالح');

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
    optionalString('requirementsIntro', 'مقدمة المتطلبات', { max: 300 }),
    requiredInt('minAge', 'الحد الأدنى للعمر', { min: 16, max: 80 }),
    prerequisitesBody,
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
