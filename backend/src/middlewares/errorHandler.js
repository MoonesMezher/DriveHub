const ApiError = require('../utils/ApiError');
const { mapMongooseError } = require('../utils/mongooseErrors');
const logger = require('../utils/logger');
const config = require('../config');
const { ERR } = require('../constants/errorMessages');

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const mapped = mapMongooseError(err);
    const error = mapped || err;

    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error.message || ERR.INTERNAL;

    if (statusCode >= 500) {
        logger.error(message, {
            requestId: req.requestId,
            path: req.originalUrl,
            stack: error.stack,
        });
    }

    const payload = {
        success: false,
        message,
    };

    if (error.details) {
        payload.details = error.details;
    }

    if (req.requestId) {
        payload.requestId = req.requestId;
    }

    if (config.env === 'development' && statusCode === 500) {
        payload.stack = error.stack;
    }

    res.status(statusCode).json(payload);
};

module.exports = errorHandler;
