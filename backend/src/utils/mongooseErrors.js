const ApiError = require('./ApiError');
const { ERR } = require('../constants/errorMessages');

const FIELD_LABELS = {
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    userId: 'المستخدم',
    courseId: 'الدورة',
    schoolId: 'المدرسة',
};

const mapMongooseError = (err) => {
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return new ApiError(400, ERR.VALIDATION_FAILED, details);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        const label = FIELD_LABELS[field] || field;
        return new ApiError(409, ERR.DUPLICATE_VALUE(label));
    }

    if (err.name === 'CastError') {
        const label = FIELD_LABELS[err.path] || err.path;
        return new ApiError(400, ERR.INVALID_FIELD(label));
    }

    return null;
};

module.exports = { mapMongooseError };
