const { body } = require('express-validator');
const msg = require('./messages');

const uploadMediaRules = [
    body('category')
        .optional({ values: 'null' })
        .isIn(['ad', 'content', 'question', 'thumbnail', 'general'])
        .withMessage(msg.mustBeIn('تصنيف الصورة', ['ad', 'content', 'question', 'thumbnail', 'general'])),
];

module.exports = {
    uploadMediaRules,
};
