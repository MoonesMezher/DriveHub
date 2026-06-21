const { body } = require('express-validator');
const msg = require('./messages');
const {
    mongoIdBody,
    optionalMongoIdBody,
    stringArrayBody,
    requiredEnumBody,
    optionalBoolean,
} = require('./chains');

const assignInstructorRules = [
    body('userId').optional().isMongoId().withMessage(msg.mustBeMongoId('المستخدم')),
    body('email').optional().isEmail().withMessage(msg.mustBeEmail),
    body().custom((_, { req }) => {
        if (!req.body.userId && !req.body.email) {
            throw new Error('يجب إدخال البريد الإلكتروني أو معرّف المستخدم');
        }
        return true;
    }),
    mongoIdBody('schoolId', 'المدرسة'),
    stringArrayBody('licenseCategories', 'فئات الرخص', { min: 1, max: 10 }),
    requiredEnumBody('gender', 'الجنس', ['male', 'female']),
    optionalBoolean('isFemaleCoach', 'مدربة'),
];

const updateInstructorRules = [
    stringArrayBody('licenseCategories', 'فئات الرخص', { max: 10 }),
    body('gender').optional().isIn(['male', 'female']).withMessage(msg.mustBeIn('الجنس', ['male', 'female'])),
    optionalBoolean('isFemaleCoach', 'مدربة'),
    body('status').optional().isIn(['active', 'suspended']).withMessage(msg.mustBeIn('الحالة', ['active', 'suspended'])),
];

module.exports = {
    assignInstructorRules,
    updateInstructorRules,
};
