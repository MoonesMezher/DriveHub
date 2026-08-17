const { User, UserRole } = require('../models');
const jwtService = require('../utils/jwtService');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { getEffectivePermissions } = require('../constants/rolePermissions');
const { ROLES } = require('../constants/roles');

const auth = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization?.startsWith('Bearer ')) {
            return next(new ApiError(401, ERR.UNAUTHORIZED));
        }

        const token = authorization.split(' ')[1];
        const decoded = jwtService.verifyAccessToken(token);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return next(new ApiError(401, ERR.UNAUTHORIZED));
        }

        if (user.isSuspended()) {
            return next(new ApiError(403, ERR.ACCOUNT_SUSPENDED));
        }

        // Always resolve roles from DB so post-payment STUDENT grants work
        // even when the JWT was issued while the user was still REGISTERED.
        const dbRoles = await UserRole.find({ userId: user._id, status: 'active' })
            .select('role schoolId')
            .lean();
        const roleNames = dbRoles.map((r) => r.role);

        let activeRole = user.activeContext?.role || decoded.role;
        let activeSchoolId = user.activeContext?.schoolId?.toString() || decoded.schoolId || null;

        // Heal stale REGISTERED context after wallet/staff payment granted STUDENT.
        if (activeRole === ROLES.REGISTERED && roleNames.includes(ROLES.STUDENT)) {
            const studentRole = dbRoles.find((r) => r.role === ROLES.STUDENT);
            activeRole = ROLES.STUDENT;
            activeSchoolId = studentRole?.schoolId?.toString() || activeSchoolId;
            user.activeContext = {
                role: ROLES.STUDENT,
                schoolId: studentRole?.schoolId || user.activeContext?.schoolId || null,
            };
            await user.save();
        }

        const roles = [...new Set([activeRole, ...roleNames].filter(Boolean))];

        req._user = {
            ...decoded,
            userId: decoded.userId || user._id.toString(),
            role: activeRole,
            schoolId: activeSchoolId,
            roles: dbRoles.map((r) => ({
                role: r.role,
                schoolId: r.schoolId?.toString() || null,
            })),
            name: user.name,
            status: user.status,
            permissions: getEffectivePermissions(roles),
        };

        return next();
    } catch (err) {
        if (err instanceof ApiError) {
            return next(err);
        }
        return next(new ApiError(401, ERR.INVALID_TOKEN));
    }
};

module.exports = auth;
