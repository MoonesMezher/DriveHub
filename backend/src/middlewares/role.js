const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const role = (...roles) => (req, res, next) => {
    if (!req._user) {
        return next(new ApiError(401, ERR.UNAUTHORIZED));
    }
    const userRole = req._user.role;
    if (!roles.includes(userRole)) {
        return next(new ApiError(403, ERR.ACTION_DENIED));
    }
    return next();
};

module.exports = role;
