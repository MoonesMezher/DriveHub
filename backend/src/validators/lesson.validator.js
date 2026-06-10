const { body } = require('express-validator');
const msg = require('./messages');
const {
    mongoIdBody,
    optionalMongoIdBody,
    requiredDate,
    optionalInt,
    optionalString,
} = require('./chains');

const bookLessonRules = [
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    mongoIdBody('coachId', 'المدرب'),
    requiredDate('scheduledAt', 'موعد الدرس'),
    optionalInt('durationMinutes', 'مدة الدرس', { min: 30, max: 120 }),
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

module.exports = {
    bookLessonRules,
    completeLessonRules,
    coachNoteRules,
};
