const { body } = require('express-validator');
const msg = require('./messages');
const {
    mongoIdBody,
    optionalMongoIdBody,
    requiredLicenseCode,
    optionalLicenseSubCode,
    requiredInt,
    optionalInt,
    requiredEnumBody,
    optionalEnumBody,
    requiredString,
    requiredDate,
} = require('./chains');

const optionalLicenseCode = (field = 'categoryCode') =>
    body(field)
        .optional({ values: 'null' })
        .trim()
        .isLength({ min: 1, max: 3 })
        .withMessage(msg.licenseCodeInvalid)
        .custom((value) => {
            if (!value) return true;
            const code = String(value).toUpperCase();
            if (!/^[A-Z](?:\d{1,2})?$/.test(code)) throw new Error(msg.licenseCodeInvalid);
            return true;
        });

const startPracticeExamRules = [
    optionalMongoIdBody('enrollmentId', 'طلب الاشتراك'),
    optionalMongoIdBody('schoolId', 'المدرسة'),
    optionalLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    optionalInt('questionCount', 'عدد الأسئلة', { min: 5, max: 100 }),
    optionalInt('durationSeconds', 'مدة الاختبار', { min: 60, max: 7200 }),
];

const submitPracticeExamRules = [
    body('score').optional().isInt({ min: 0, max: 100 }).withMessage('النتيجة يجب أن تكون بين 0 و 100'),
    body('passed').optional().isBoolean().withMessage(msg.mustBeBoolean('حالة النجاح')),
    optionalInt('attempt', 'رقم المحاولة', { min: 1, max: 100 }),
    optionalInt('durationSeconds', 'مدة الاختبار', { min: 0, max: 7200 }),
    body('answers').isArray({ min: 1 }).withMessage('يجب إرسال إجابات الاختبار'),
    body('answers.*.questionId').isMongoId().withMessage('معرّف السؤال غير صالح'),
];

const finalExamResultRules = [
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    body('theoryScore').optional().isFloat({ min: 0, max: 100 }).withMessage('علامة النظري يجب أن تكون بين 0 و 100'),
    body('practicalScore').optional().isFloat({ min: 0, max: 100 }).withMessage('علامة العملي يجب أن تكون بين 0 و 100'),
    requiredEnumBody('finalStatus', 'الحالة النهائية', [
        'pending',
        'theory_passed',
        'final_passed',
        'final_failed_theory',
        'final_failed_practical',
    ]),
    optionalEnumBody('retakeScope', 'نطاق الإعادة', ['full', 'practical_only']),
    optionalInt('attemptNumber', 'رقم المحاولة', { min: 1, max: 20 }),
];

const trafficScheduleRules = [
    requiredString('governorate', 'المحافظة', { min: 2, max: 100 }),
    mongoIdBody('studentId', 'الطالب'),
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    requiredEnumBody('examType', 'نوع الامتحان', ['theory', 'practical']),
    requiredDate('examDate', 'تاريخ الامتحان'),
    requiredString('branch', 'الفرع', { min: 2, max: 200 }),
];

const trafficResultRules = [
    mongoIdBody('studentId', 'الطالب'),
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    requiredEnumBody('examType', 'نوع الامتحان', ['theory', 'practical']),
    body('passed').isBoolean().withMessage(msg.mustBeBoolean('حالة النجاح')),
    body('score').optional().isFloat({ min: 0, max: 100 }).withMessage('العلامة يجب أن تكون بين 0 و 100'),
    optionalMongoIdBody('scheduleId', 'موعد الامتحان'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('الملاحظات طويلة جداً'),
];

const drivingLicenseRecordRules = [
    mongoIdBody('userId', 'المستخدم'),
    requiredLicenseCode('categoryCode'),
    optionalLicenseSubCode('subTypeCode'),
    requiredDate('issueDate', 'تاريخ الإصدار'),
    body('certificateNumber').optional().trim().isLength({ max: 100 }).withMessage('رقم الشهادة طويل جداً'),
    optionalMongoIdBody('enrollmentId', 'طلب الاشتراك'),
];

module.exports = {
    startPracticeExamRules,
    submitPracticeExamRules,
    finalExamResultRules,
    trafficScheduleRules,
    trafficResultRules,
    drivingLicenseRecordRules,
};
