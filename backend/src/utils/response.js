const success = (res, data = null, options = {}) => {
    const { status = 200, message, meta } = options;
    const payload = { success: true };
    if (message) payload.message = message;
    if (data !== null) payload.data = data;
    if (meta) payload.meta = meta;
    return res.status(status).json(payload);
};

const created = (res, data, message) => success(res, data, { status: 201, message });

const paginated = (res, data, pagination) =>
    success(res, data, { meta: { pagination } });

module.exports = { success, created, paginated };
