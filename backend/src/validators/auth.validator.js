const { body } = require('express-validator');
const { ROLE_LIST } = require('../constants/roles');
const msg = require('./messages');
const {
    requiredString,
    optionalString,
    requiredEmail,
    requiredPassword,
    optionalPhone,
    optionalMongoIdBody,
} = require('./chains');

const registerRules = [
    requiredString('name', 'الاسم', { min: 2, max: 120 }),
    requiredEmail('email'),
    optionalPhone('phone'),
    requiredPassword('password'),
];

const loginRules = [
    requiredEmail('email'),
    body('password').notEmpty().withMessage(msg.required('كلمة المرور')),
    body('portal')
        .optional()
        .isIn(['student', 'school', 'admin'])
        .withMessage('بوابة الدخول غير صالحة (student, school, admin)'),
];

const refreshRules = [
    body('refreshToken').notEmpty().withMessage(msg.required('رمز التحديث')),
];

const switchContextRules = [
    body('role')
        .notEmpty()
        .withMessage(msg.required('الدور'))
        .isIn(ROLE_LIST)
        .withMessage(msg.mustBeIn('الدور', ROLE_LIST)),
    optionalMongoIdBody('schoolId', 'المدرسة'),
];

const logoutRules = [
    body('refreshToken').optional().isString().withMessage('رمز التحديث غير صالح'),
];

const updateProfileRules = [
    optionalString('name', 'الاسم', { max: 120 }),
    optionalPhone('phone'),
    body('profileData').optional().isObject().withMessage('بيانات الملف الشخصي غير صالحة'),
];

module.exports = {
    registerRules,
    loginRules,
    refreshRules,
    switchContextRules,
    logoutRules,
    updateProfileRules,
};
