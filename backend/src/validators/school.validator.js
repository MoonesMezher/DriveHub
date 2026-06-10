const { body } = require('express-validator');
const msg = require('./messages');
const {
    requiredString,
    optionalString,
    requiredEmail,
    optionalEmail,
    requiredPhone,
    optionalPhone,
    requiredLat,
    requiredLng,
    stringArrayBody,
    optionalBoolean,
    optionalMongoIdBody,
} = require('./chains');

const createSchoolRules = [
    requiredString('name', 'اسم المدرسة', { min: 2, max: 150 }),
    requiredString('address', 'العنوان', { min: 5, max: 300 }),
    optionalString('description', 'الوصف', { max: 2000 }),
    optionalString('governorate', 'المحافظة', { max: 100 }),
    requiredLat('lat'),
    requiredLng('lng'),
    optionalPhone('phone'),
    optionalEmail('email'),
    stringArrayBody('licenses', 'الرخص المدعومة', { max: 20 }),
    body('vehiclesCount').optional().isInt({ min: 0, max: 500 }).withMessage('عدد المركبات غير صالح'),
    optionalBoolean('hasFemaleCoaches', 'مدربات إناث'),
    optionalBoolean('preRegistrationEnabled', 'التسجيل المسبق'),
];

const updateSchoolRules = [
    optionalString('name', 'اسم المدرسة', { max: 150 }),
    optionalString('address', 'العنوان', { max: 300 }),
    optionalString('description', 'الوصف', { max: 2000 }),
    optionalString('governorate', 'المحافظة', { max: 100 }),
    body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage(msg.latInvalid),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage(msg.lngInvalid),
    optionalPhone('phone'),
    optionalEmail('email'),
    stringArrayBody('licenses', 'الرخص المدعومة'),
    body('vehiclesCount').optional().isInt({ min: 0, max: 500 }).withMessage('عدد المركبات غير صالح'),
    optionalBoolean('hasFemaleCoaches', 'مدربات إناث'),
    optionalBoolean('registrationPaused', 'إيقاف التسجيل'),
    optionalBoolean('preRegistrationEnabled', 'التسجيل المسبق'),
    body('status').optional().isIn(['active', 'suspended']).withMessage(msg.mustBeIn('الحالة', ['active', 'suspended'])),
];

const schoolApplicationRules = [
    requiredString('schoolName', 'اسم المدرسة', { min: 2, max: 150 }),
    requiredString('address', 'العنوان', { min: 5, max: 300 }),
    optionalString('governorate', 'المحافظة', { max: 100 }),
    requiredLat('lat'),
    requiredLng('lng'),
    requiredPhone('phone'),
    requiredEmail('email'),
    stringArrayBody('licenses', 'الرخص المدعومة', { min: 1, max: 20 }),
    body('bankAccount').optional().trim().isLength({ min: 5, max: 50 }).withMessage('رقم الحساب البنكي غير صالح'),
];

const reviewSchoolApplicationRules = [
    body('status')
        .notEmpty()
        .withMessage(msg.required('قرار المراجعة'))
        .isIn(['approved', 'rejected'])
        .withMessage(msg.mustBeIn('قرار المراجعة', ['approved', 'rejected'])),
    body('rejectionReason')
        .if(body('status').equals('rejected'))
        .notEmpty()
        .withMessage('سبب الرفض مطلوب عند رفض الطلب')
        .isLength({ max: 500 })
        .withMessage('سبب الرفض طويل جداً'),
    optionalMongoIdBody('createdSchoolId', 'المدرسة المنشأة'),
];

module.exports = {
    createSchoolRules,
    updateSchoolRules,
    schoolApplicationRules,
    reviewSchoolApplicationRules,
};
