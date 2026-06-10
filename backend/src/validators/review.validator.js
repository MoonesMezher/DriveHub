const { body } = require('express-validator');
const msg = require('./messages');
const { mongoIdBody, optionalString } = require('./chains');

const createReviewRules = [
    mongoIdBody('schoolId', 'المدرسة'),
    body('rating')
        .notEmpty()
        .withMessage(msg.required('التقييم'))
        .isInt({ min: 1, max: 5 })
        .withMessage('التقييم يجب أن يكون بين 1 و 5'),
    optionalString('comment', 'التعليق', { max: 1000 }),
];

const moderateReviewRules = [
    body('adminStatus')
        .notEmpty()
        .withMessage(msg.required('قرار الإدارة'))
        .isIn(['approved', 'rejected'])
        .withMessage(msg.mustBeIn('قرار الإدارة', ['approved', 'rejected'])),
];

module.exports = {
    createReviewRules,
    moderateReviewRules,
};
