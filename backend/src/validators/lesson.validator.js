const { body, query } = require('express-validator');
const msg = require('./messages');
const {
    mongoIdBody,
    optionalMongoIdBody,
    requiredDate,
    optionalInt,
    optionalString,
    optionalBooleanQuery,
} = require('./chains');

const bookLessonRules = [
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    mongoIdBody('coachId', 'المدرب'),
    requiredDate('scheduledAt', 'موعد الدرس'),
    optionalInt('durationMinutes', 'مدة الدرس', { min: 60, max: 60 }),
];

const completeLessonRules = [
    body('status')
        .optional()
        .isIn(['completed', 'cancelled', 'no_show'])
        .withMessage(msg.mustBeIn('حالة الدرس', ['completed', 'cancelled', 'no_show'])),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
    optionalString('coachNotes', 'ملاحظات المدرب', { max: 2000 }),
];

const coachNoteRules = [
    mongoIdBody('studentId', 'الطالب'),
    mongoIdBody('schoolId', 'المدرسة'),
    optionalString('personalNotes', 'الملاحظات الشخصية', { max: 3000 }),
    body('lessonRating').optional().isInt({ min: 1, max: 5 }).withMessage('تقييم الدرس يجب أن يكون بين 1 و 5'),
    optionalMongoIdBody('enrollmentId', 'طلب الاشتراك'),
    optionalMongoIdBody('lessonId', 'الدرس'),
];

const autoBookLessonRules = [
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    optionalInt('durationMinutes', 'مدة الدرس', { min: 60, max: 60 }),
    body('mode')
        .optional()
        .isIn(['day', 'week'])
        .withMessage(msg.mustBeIn('نوع الفترة', ['day', 'week'])),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('تاريخ الفترة غير صالح'),
    body('femaleCoachOnly')
        .optional()
        .isBoolean()
        .withMessage(msg.mustBeBoolean('مدربة أنثى')),
];

const availableCoachesRules = [
    query('enrollmentId')
        .notEmpty()
        .withMessage(msg.required('طلب الاشتراك'))
        .isMongoId()
        .withMessage(msg.mustBeMongoId('طلب الاشتراك')),
    query('mode')
        .notEmpty()
        .withMessage(msg.required('نوع الفترة'))
        .isIn(['day', 'week'])
        .withMessage(msg.mustBeIn('نوع الفترة', ['day', 'week'])),
    query('date')
        .notEmpty()
        .withMessage(msg.required('التاريخ'))
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('التاريخ غير صالح'),
    optionalBooleanQuery('femaleCoachOnly', 'مدربة أنثى'),
];

const postponeLessonRules = [
    requiredDate('scheduledAt', 'الموعد الجديد'),
];

module.exports = {
    bookLessonRules,
    autoBookLessonRules,
    availableCoachesRules,
    postponeLessonRules,
    completeLessonRules,
    coachNoteRules,
};
