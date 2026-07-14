const { body } = require('express-validator');
const msg = require('./messages');
const { requiredString, optionalString } = require('./chains');

const createRequirementRules = [
    requiredString('title', 'العنوان', { min: 2, max: 200 }),
    requiredString('description', 'الوصف', { min: 3, max: 5000 }),
    optionalString('icon', 'الأيقونة', { max: 80 }),
    optionalString('category', 'التصنيف', { max: 100 }),
    optionalString('imageUrl', 'رابط الصورة', { max: 500 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

const updateRequirementRules = [
    body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('العنوان غير صالح'),
    body('description').optional().trim().isLength({ min: 3, max: 5000 }).withMessage('الوصف غير صالح'),
    optionalString('icon', 'الأيقونة', { max: 80 }),
    optionalString('category', 'التصنيف', { max: 100 }),
    optionalString('imageUrl', 'رابط الصورة', { max: 500 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

module.exports = {
    createRequirementRules,
    updateRequirementRules,
};
