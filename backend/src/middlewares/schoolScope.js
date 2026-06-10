const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { ROLES } = require('../constants/roles');

const schoolScope = (req, res, next) => {
    const role = req._user?.role;
    const schoolId = req._user?.schoolId;

    if ([ROLES.ADMIN, ROLES.TRAFFIC].includes(role)) {
        req.schoolScope = null;
        return next();
    }

    if ([ROLES.MANAGER, ROLES.COACH].includes(role)) {
        if (!schoolId) {
            return next(new ApiError(403, ERR.SCHOOL_CONTEXT_REQUIRED));
        }
        req.schoolScope = schoolId;
        return next();
    }

    req.schoolScope = schoolId || null;
    return next();
};

module.exports = schoolScope;
