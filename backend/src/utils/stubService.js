const ApiError = require('./ApiError');
const { ERR } = require('../constants/errorMessages');

/**
 * يرمي خطأ 501 — للخدمات التي لم يُنفَّذ منطقها بعد.
 */
const notImplemented = (service, method) => {
    throw new ApiError(501, `${service}.${method}: ${ERR.NOT_IMPLEMENTED}`);
};

const createStubMethod = (service, method) => async () => notImplemented(service, method);

module.exports = { notImplemented, createStubMethod };
