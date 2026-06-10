const { body } = require('express-validator');
const msg = require('./messages');
const { mongoIdBody } = require('./chains');

const createRosterRules = [
    mongoIdBody('courseId', 'الدورة'),
    mongoIdBody('schoolId', 'المدرسة'),
    body('studentIds')
        .isArray({ min: 1, max: 500 })
        .withMessage('يجب تضمين طالب واحد على الأقل')
        .custom((ids) => ids.every((id) => /^[a-f\d]{24}$/i.test(String(id))))
        .withMessage('معرّفات الطلاب غير صالحة'),
    body('enrollmentIds')
        .optional()
        .isArray({ max: 500 })
        .withMessage('معرّفات الاشتراك غير صالحة'),
];

const submitRosterRules = [
    body('status')
        .optional()
        .isIn(['submitted'])
        .withMessage(msg.mustBeIn('حالة القائمة', ['submitted'])),
];

const distributeRosterRules = [
    body('trafficBatchId').optional().trim().isLength({ max: 100 }).withMessage('معرّف الدفعة طويل جداً'),
];

module.exports = {
    createRosterRules,
    submitRosterRules,
    distributeRosterRules,
};
