const { validationResult } = require('express-validator');
const msg = require('../validators/messages');

const formatErrors = (errors) =>
    errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
        location: err.location,
    }));

const handleValidationErrors = (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        const errors = formatErrors(result);
        return res.status(400).json({
            success: false,
            message: errors[0]?.message || msg.validationFailed,
            errors,
        });
    }

    return next();
};

module.exports = handleValidationErrors;
