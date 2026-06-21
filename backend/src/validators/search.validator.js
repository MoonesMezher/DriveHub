const { query } = require('express-validator');
const msg = require('./messages');

const searchQueryRules = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage(msg.required('كلمة البحث'))
        .isLength({ min: 2, max: 100 })
        .withMessage('كلمة البحث يجب أن تكون بين 2 و 100 حرفاً'),
];

module.exports = { searchQueryRules };
