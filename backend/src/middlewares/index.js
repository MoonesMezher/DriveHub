const limiter = require('./limiter');
const uploadMw = require('./upload');

module.exports = {
    auth: require('./auth'),
    optionalAuth: require('./optionalAuth'),
    role: require('./role'),
    validate: require('./validate'),
    id: require('./id'),
    xssSanitize: require('./xss'),
    mongoSanitize: require('./mongoSanitize'),
    limiter,
    ...limiter,
    errorHandler: require('./errorHandler'),
    notFound: require('./notFound'),
    requestId: require('./requestId'),
    pagination: require('./pagination'),
    schoolScope: require('./schoolScope'),
    audit: require('./audit'),
    upload: uploadMw,
    routeKit: require('./routeKit'),
};
