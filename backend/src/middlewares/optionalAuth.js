const { User } = require('../models');
const jwtService = require('../utils/jwtService');
const { ROLES } = require('../constants/roles');

/**
 * Attaches user if valid token present; continues as guest otherwise.
 */
const optionalAuth = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization?.startsWith('Bearer ')) {
            req._user = { role: ROLES.GUEST, permissions: [] };
            return next();
        }

        const token = authorization.split(' ')[1];
        const decoded = jwtService.verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (!user || user.isSuspended()) {
            req._user = { role: ROLES.GUEST, permissions: [] };
            return next();
        }

        req._user = { ...decoded, name: user.name, status: user.status };
        return next();
    } catch {
        req._user = { role: ROLES.GUEST, permissions: [] };
        return next();
    }
};

module.exports = optionalAuth;
