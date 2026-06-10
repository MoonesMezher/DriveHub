const { body } = require('express-validator');
const msg = require('./messages');
const { ROLE_LIST } = require('../constants/roles');
const {
    requiredLicenseCode,
    optionalLicenseSubCode,
    requiredInt,
    requiredString,
    optionalString,
    mongoIdBody,
    optionalMongoIdBody,
    requiredEnumBody,
    optionalDate,
} = require('./chains');

const upsertPricingRules = [
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    requiredInt('fixedPrice', 'السعر', { min: 0 }),
    body('currency').optional().trim().isLength({ min: 3, max: 3 }).withMessage('رمز العملة يجب أن يكون 3 أحرف (مثل SYP)'),
    optionalDate('effectiveFrom', 'تاريخ السريان'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

const updateCommissionRules = [
    body('commission')
        .notEmpty()
        .withMessage(msg.required('نسبة العمولة'))
        .isFloat({ min: 0, max: 1 })
        .withMessage('نسبة العمولة يجب أن تكون بين 0 و 1 (مثال: 0.02 = 2%)'),
];

const createAdRules = [
    requiredString('title', 'عنوان الإعلان', { min: 2, max: 200 }),
    optionalString('imageUrl', 'رابط الصورة', { max: 500 }),
    optionalString('link', 'رابط الإعلان', { max: 500 }),
    requiredEnumBody('placement', 'موضع الإعلان', ['home', 'student', 'sidebar', 'banner']),
    body('status').optional().isIn(['draft', 'active', 'paused', 'expired']).withMessage(msg.mustBeIn('حالة الإعلان', ['draft', 'active', 'paused', 'expired'])),
    optionalDate('startDate', 'تاريخ البداية'),
    optionalDate('endDate', 'تاريخ النهاية'),
    body('order').optional().isInt({ min: 0, max: 100 }).withMessage('ترتيب العرض غير صالح'),
];

const assignRoleRules = [
    mongoIdBody('userId', 'المستخدم'),
    body('role')
        .notEmpty()
        .withMessage(msg.required('الدور'))
        .isIn(ROLE_LIST)
        .withMessage('الدور غير صالح'),
    optionalMongoIdBody('schoolId', 'المدرسة'),
    body('licenseCategories').optional().isArray({ max: 10 }).withMessage('فئات الرخص غير صالحة'),
];

const suspendUserRules = [
    body('status')
        .notEmpty()
        .withMessage(msg.required('الحالة'))
        .isIn(['active', 'suspended'])
        .withMessage(msg.mustBeIn('الحالة', ['active', 'suspended'])),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('سبب الإيقاف طويل جداً'),
];

module.exports = {
    upsertPricingRules,
    updateCommissionRules,
    createAdRules,
    assignRoleRules,
    suspendUserRules,
};
