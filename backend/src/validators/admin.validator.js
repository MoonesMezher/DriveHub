const { body } = require('express-validator');
const msg = require('./messages');
const { ROLE_LIST } = require('../constants/roles');
const {
    requiredLicenseCode,
    optionalLicenseSubCode,
    requiredInt,
    requiredString,
    requiredPersonName,
    optionalString,
    requiredEmail,
    requiredPhone,
    mongoIdBody,
    optionalMongoIdBody,
    requiredEnumBody,
    optionalDate,
    optionalMediaRef,
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
    optionalMediaRef('imageUrl', 'صورة الإعلان'),
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

const updatePrivacyRules = [
    body('content')
        .notEmpty()
        .withMessage(msg.required('محتوى سياسة الخصوصية'))
        .isLength({ min: 50, max: 50000 })
        .withMessage('محتوى سياسة الخصوصية غير صالح'),
];

const updateRegistrationRules = [
    body('registrationPaused').isBoolean().withMessage(msg.mustBeBoolean('إيقاف التسجيل')),
];

const createTrafficAccountRules = [
    requiredPersonName('name', 'الاسم', { min: 2, max: 100 }),
    requiredEmail('email'),
    requiredPhone('phone'),
    body('password')
        .notEmpty()
        .withMessage(msg.required('كلمة المرور'))
        .isLength({ min: 8, max: 128 })
        .withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
];

const rejectComplianceRules = [
    body('rejectionReason')
        .notEmpty()
        .withMessage(msg.required('سبب الرفض'))
        .isLength({ min: 3, max: 500 })
        .withMessage('سبب الرفض يجب أن يكون بين 3 و 500 حرف'),
];

const assignSchoolManagerRules = [
    body('replace').optional().isBoolean().withMessage(msg.mustBeBoolean('استبدال المدير')),
    optionalMongoIdBody('userId', 'المستخدم'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('الاسم غير صالح'),
    body('email').optional().trim().isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').optional().trim().isLength({ min: 7, max: 20 }).withMessage('رقم الهاتف غير صالح'),
    body('password').optional().isLength({ min: 8, max: 128 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    body().custom((_, { req }) => {
        const { userId, name, email, phone, password } = req.body;
        if (userId) {
            if (name || email || phone || password) {
                throw new Error('اختر إما تعيين مستخدم موجود أو إنشاء حساب جديد');
            }
            return true;
        }
        if (!name?.trim()) throw new Error(msg.required('الاسم'));
        if (!email?.trim()) throw new Error(msg.required('البريد الإلكتروني'));
        if (!phone?.trim()) throw new Error(msg.required('رقم الهاتف'));
        if (!password) throw new Error(msg.required('كلمة المرور'));
        if (/[\d\u0660-\u0669]/.test(name)) {
            throw new Error('الاسم لا يجب أن يحتوي على أرقام');
        }
        return true;
    }),
];

module.exports = {
    upsertPricingRules,
    updateCommissionRules,
    createAdRules,
    assignRoleRules,
    suspendUserRules,
    updatePrivacyRules,
    updateRegistrationRules,
    createTrafficAccountRules,
    rejectComplianceRules,
    assignSchoolManagerRules,
};
