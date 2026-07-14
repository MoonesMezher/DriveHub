const { body } = require('express-validator');
const msg = require('./messages');
const { requiredString, optionalString } = require('./chains');

const createTestimonialRules = [
    requiredString('name', 'الاسم', { min: 2, max: 120 }),
    optionalString('role', 'الصفة', { max: 120 }),
    requiredString('quote', 'الاقتباس', { min: 3, max: 2000 }),
    body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
    optionalString('avatar', 'الصورة', { max: 500 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

const updateTestimonialRules = [
    body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('الاسم غير صالح'),
    optionalString('role', 'الصفة', { max: 120 }),
    body('quote').optional().trim().isLength({ min: 3, max: 2000 }).withMessage('الاقتباس غير صالح'),
    body('rating').optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
    optionalString('avatar', 'الصورة', { max: 500 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

module.exports = {
    createTestimonialRules,
    updateTestimonialRules,
};
