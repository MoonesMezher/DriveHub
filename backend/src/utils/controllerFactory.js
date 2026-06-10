const asyncHandler = require('./asyncHandler');
const { success, created } = require('./response');

/**
 * يُنشئ controller يستدعي service method ويُعيد الاستجابة الموحّدة.
 */
const makeHandler = (serviceCall, { status = 200, message, wrap } = {}) =>
    asyncHandler(async (req, res) => {
        const result = await serviceCall(req, res);
        const data = wrap ? wrap(result) : result;
        if (status === 201) return created(res, data, message);
        return success(res, data, message ? { message } : undefined);
    });

module.exports = { makeHandler };
