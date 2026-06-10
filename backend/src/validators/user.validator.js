const { body } = require('express-validator');
const msg = require('./messages');
const { optionalString, optionalPhone, optionalEmail } = require('./chains');

const updateUserRules = [
    optionalString('name', 'الاسم', { max: 120 }),
    optionalEmail('email'),
    optionalPhone('phone'),
    body('status').optional().isIn(['active', 'suspended']).withMessage(msg.mustBeIn('الحالة', ['active', 'suspended'])),
    body('profileData').optional().isObject().withMessage('بيانات الملف الشخصي غير صالحة'),
];

module.exports = {
    updateUserRules,
};
