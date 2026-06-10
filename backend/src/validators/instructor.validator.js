const { body } = require('express-validator');
const msg = require('./messages');
const {
    mongoIdBody,
    stringArrayBody,
    requiredEnumBody,
    optionalBoolean,
} = require('./chains');

const assignInstructorRules = [
    mongoIdBody('userId', 'المستخدم'),
    mongoIdBody('schoolId', 'المدرسة'),
    stringArrayBody('licenseCategories', 'فئات الرخص', { min: 1, max: 10 }),
    requiredEnumBody('gender', 'الجنس', ['male', 'female', 'other']),
    optionalBoolean('isFemaleCoach', 'مدربة'),
];

const updateInstructorRules = [
    stringArrayBody('licenseCategories', 'فئات الرخص', { max: 10 }),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage(msg.mustBeIn('الجنس', ['male', 'female', 'other'])),
    optionalBoolean('isFemaleCoach', 'مدربة'),
    body('status').optional().isIn(['active', 'suspended']).withMessage(msg.mustBeIn('الحالة', ['active', 'suspended'])),
];

module.exports = {
    assignInstructorRules,
    updateInstructorRules,
};
