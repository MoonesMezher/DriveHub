const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { getEffectivePermissions } = require('../constants/rolePermissions');

const userHasRole = (req, ...roles) => {
    const active = req._user?.role;
    const assigned = req._user?.roles?.map((r) => r.role) || [];
    const all = [...new Set([active, ...assigned].filter(Boolean))];
    return roles.some((role) => all.includes(role));
};

const userHasPermission = (req, permission) => {
    const perms = req._user?.permissions || getEffectivePermissions(
        [req._user?.role, ...(req._user?.roles?.map((r) => r.role) || [])].filter(Boolean),
    );
    return perms.includes(permission);
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req._user) return next(new ApiError(401, ERR.UNAUTHORIZED));
    if (!userHasRole(req, ...roles)) return next(new ApiError(403, ERR.INSUFFICIENT_ROLE));
    return next();
};

const requirePermission = (...permissions) => (req, res, next) => {
    if (!req._user) return next(new ApiError(401, ERR.UNAUTHORIZED));
    const missing = permissions.filter((p) => !userHasPermission(req, p));
    if (missing.length) return next(new ApiError(403, ERR.INSUFFICIENT_PERMISSION));
    return next();
};

const requireAnyPermission = (...permissions) => (req, res, next) => {
    if (!req._user) return next(new ApiError(401, ERR.UNAUTHORIZED));
    if (!permissions.some((p) => userHasPermission(req, p))) {
        return next(new ApiError(403, ERR.INSUFFICIENT_PERMISSION));
    }
    return next();
};

module.exports = {
    userHasRole,
    userHasPermission,
    requireRole,
    requirePermission,
    requireAnyPermission,
};
