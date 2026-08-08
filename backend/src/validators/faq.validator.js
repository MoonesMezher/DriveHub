const { body } = require('express-validator');
const msg = require('./messages');
const { requiredString, optionalString } = require('./chains');

const optionalHttpUrl = (field, label) =>
    body(field)
        .optional({ values: 'falsy' })
        .trim()
        .isURL({ protocols: ['http', 'https'], require_protocol: true, require_valid_protocol: true })
        .withMessage(`${label} غير صالح — يجب أن يبدأ بـ http:// أو https://`);

const createFaqRules = [
    requiredString('question', 'السؤال', { min: 3, max: 500 }),
    requiredString('answer', 'الإجابة', { min: 3, max: 10000 }),
    optionalString('category', 'التصنيف', { max: 100 }),
    optionalHttpUrl('linkUrl', 'الرابط'),
    optionalString('linkLabel', 'نص الرابط', { max: 200 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

const updateFaqRules = [
    body('question').optional().trim().isLength({ min: 3, max: 500 }).withMessage('السؤال غير صالح'),
    body('answer').optional().trim().isLength({ min: 3, max: 10000 }).withMessage('الإجابة غير صالحة'),
    optionalString('category', 'التصنيف', { max: 100 }),
    optionalHttpUrl('linkUrl', 'الرابط'),
    optionalString('linkLabel', 'نص الرابط', { max: 200 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

module.exports = {
    createFaqRules,
    updateFaqRules,
};
