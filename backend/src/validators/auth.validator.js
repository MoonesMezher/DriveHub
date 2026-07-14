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

const forgotPasswordRules = [
    requiredEmail('email'),
];

const verifyResetCodeRules = [
    requiredEmail('email'),
    body('code')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('رمز التحقق يجب أن يكون 6 أرقام')
        .isNumeric()
        .withMessage('رمز التحقق يجب أن يكون أرقاماً فقط'),
];

const resetPasswordRules = [
    requiredEmail('email'),
    requiredPassword('newPassword'),
    body().custom((value) => {
        const hasCode = Boolean(value.code);
        const hasResetToken = Boolean(value.resetToken);
        if (!hasCode && !hasResetToken) {
            throw new Error('يجب إرسال رمز التحقق أو جلسة إعادة التعيين');
        }
        return true;
    }),
    body('code')
        .optional({ values: 'falsy' })
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('رمز التحقق يجب أن يكون 6 أرقام')
        .isNumeric()
        .withMessage('رمز التحقق يجب أن يكون أرقاماً فقط'),
    body('resetToken')
        .optional({ values: 'falsy' })
        .isString()
        .withMessage('جلسة إعادة التعيين غير صالحة')
        .isLength({ min: 32, max: 256 })
        .withMessage('جلسة إعادة التعيين غير صالحة'),
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
    forgotPasswordRules,
    verifyResetCodeRules,
    resetPasswordRules,
    updateProfileRules,
};
