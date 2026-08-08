const { body } = require('express-validator');
const msg = require('./messages');
const { requiredString, optionalString, optionalEnumBody } = require('./chains');
const { REQUIREMENT_SECTION_VALUES } = require('../constants/requirementSections');

const createRequirementRules = [
    optionalEnumBody('section', 'القسم', REQUIREMENT_SECTION_VALUES),
    requiredString('title', 'العنوان', { min: 2, max: 200 }),
    optionalString('description', 'الوصف', { max: 5000 }),
    optionalString('icon', 'الأيقونة', { max: 80 }),
    optionalString('category', 'التصنيف', { max: 100 }),
    optionalString('imageUrl', 'رابط الصورة', { max: 500 }),
    body('order').optional().isInt({ min: 0, max: 1000 }).withMessage('ترتيب العرض غير صالح'),
    body('isActive').optional().isBoolean().withMessage(msg.mustBeBoolean('الحالة')),
];

const updateRequirementRules = [
    optionalEnumBody('section', 'القسم', REQUIREMENT_SECTION_VALUES),
    body('title').optional().trim().isLength({ min: 2, max: 200 }).withMessage('العنوان غير صالح'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('الوصف غير صالح'),
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
