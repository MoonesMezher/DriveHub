const { body } = require('express-validator');
const { COURSE_STATUS } = require('../constants/courseStatus');
const msg = require('./messages');
const {
    mongoIdBody,
    requiredLicenseCode,
    optionalLicenseSubCode,
    requiredInt,
    optionalInt,
    optionalDate,
    optionalMongoIdBody,
} = require('./chains');

const createCourseRules = [
    mongoIdBody('schoolId', 'المدرسة'),
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    requiredInt('maxStudents', 'الحد الأقصى للطلاب', { min: 1, max: 500 }),
    optionalInt('paymentDeadlineDays', 'مهلة الدفع بالأيام', { min: 1, max: 14 }),
    optionalInt('launchAfterCloseDays', 'أيام الانطلاق بعد الإغلاق', { min: 1, max: 30 }),
];

const launchCourseRules = [
    optionalDate('previousLaunchDate', 'تاريخ إطلاق الدورة السابقة'),
    optionalMongoIdBody('previousCourseId', 'الدورة السابقة'),
];

const updateCourseRules = [
    optionalInt('maxStudents', 'الحد الأقصى للطلاب', { min: 1, max: 500 }),
    optionalInt('paymentDeadlineDays', 'مهلة الدفع بالأيام', { min: 1, max: 14 }),
    optionalInt('launchAfterCloseDays', 'أيام الانطلاق بعد الإغلاق', { min: 1, max: 30 }),
    body('status')
        .optional()
        .isIn(Object.values(COURSE_STATUS))
        .withMessage(msg.mustBeIn('حالة الدورة', Object.values(COURSE_STATUS))),
    body('registrationOpen').optional().isBoolean().withMessage(msg.mustBeBoolean('فتح التسجيل')),
];

module.exports = {
    createCourseRules,
    launchCourseRules,
    updateCourseRules,
};
