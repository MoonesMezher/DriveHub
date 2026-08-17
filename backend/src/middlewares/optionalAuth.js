const { User, UserRole } = require('../models');
const jwtService = require('../utils/jwtService');
const { ROLES } = require('../constants/roles');
const { getEffectivePermissions } = require('../constants/rolePermissions');

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

        const dbRoles = await UserRole.find({ userId: user._id, status: 'active' })
            .select('role')
            .lean();
        const roleNames = dbRoles.map((r) => r.role);
        let role = user.activeContext?.role || decoded.role || ROLES.GUEST;
        if (role === ROLES.REGISTERED && roleNames.includes(ROLES.STUDENT)) {
            role = ROLES.STUDENT;
        }

        req._user = {
            ...decoded,
            userId: decoded.userId || user._id.toString(),
            role,
            name: user.name,
            status: user.status,
            permissions: getEffectivePermissions([...new Set([role, ...roleNames].filter(Boolean))]),
        };
        return next();
    } catch {
        req._user = { role: ROLES.GUEST, permissions: [] };
        return next();
    }
};

module.exports = optionalAuth;
