const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const hasRole = (...allowedRoles) => (req, res, next) => {
    const activeRole = req._user?.role;
    if (!activeRole || !allowedRoles.includes(activeRole)) {
        return next(new ApiError(403, ERR.INSUFFICIENT_PERMISSION));
    }
    return next();
};

const hasAnyRole = (...allowedRoles) => (req, res, next) => {
    const roles = req._user?.roles?.map((r) => r.role) || [];
    const activeRole = req._user?.role;
    const allRoles = [...new Set([activeRole, ...roles].filter(Boolean))];

    if (!allRoles.some((role) => allowedRoles.includes(role))) {
        return next(new ApiError(403, ERR.INSUFFICIENT_PERMISSION));
    }
    return next();
};

module.exports = { hasRole, hasAnyRole };
