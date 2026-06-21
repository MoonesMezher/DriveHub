const { body } = require('express-validator');
const { ENROLLMENT_STATUS, RETAKE_SCOPE } = require('../constants/enrollmentStatus');
const msg = require('./messages');
const {
    mongoIdBody,
    optionalMongoIdBody,
    requiredLicenseCode,
    optionalLicenseSubCode,
    optionalBoolean,
    optionalInt,
    requiredEnumBody,
    optionalEnumBody,
} = require('./chains');

const MANAGER_REVIEW_STATUSES = [
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.REJECTED,
    ENROLLMENT_STATUS.UNDER_REVIEW,
];

const createEnrollmentRules = [
    mongoIdBody('courseId', 'الدورة'),
    mongoIdBody('schoolId', 'المدرسة'),
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    optionalBoolean('prefersFemaleCoach', 'تفضيل مدربة'),
];

const cancelEnrollmentRules = [
    body('reason').optional().trim().isLength({ max: 300 }).withMessage('سبب الإلغاء طويل جداً'),
];

const reviewEnrollmentRules = [
    requiredEnumBody('status', 'قرار المراجعة', MANAGER_REVIEW_STATUSES),
    optionalInt('paymentDeadlineDays', 'مهلة الدفع بالأيام', { min: 1, max: 14 }),
    body('rejectionReason')
        .if(body('status').equals(ENROLLMENT_STATUS.REJECTED))
        .notEmpty()
        .withMessage('سبب الرفض مطلوب')
        .isLength({ max: 500 }),
];

const acceptEnrollmentRules = [
    optionalInt('paymentDeadlineDays', 'مهلة الدفع بالأيام', { min: 1, max: 14 }),
];

const rejectEnrollmentRules = [
    body('rejectionReason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('سبب الرفض طويل جداً'),
];

const preRegistrationRules = [
    mongoIdBody('schoolId', 'المدرسة'),
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
];

const waitlistPromoteRules = [
    optionalMongoIdBody('enrollmentId', 'طلب الاشتراك'),
];

const retakeEnrollmentRules = [
    mongoIdBody('priorEnrollmentId', 'الاشتراك السابق'),
    optionalEnumBody('retakeScope', 'نطاق الإعادة', Object.values(RETAKE_SCOPE)),
];

module.exports = {
    createEnrollmentRules,
    cancelEnrollmentRules,
    reviewEnrollmentRules,
    acceptEnrollmentRules,
    rejectEnrollmentRules,
    preRegistrationRules,
    waitlistPromoteRules,
    retakeEnrollmentRules,
};
