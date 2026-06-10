const { User } = require('../models');
const jwtService = require('../utils/jwtService');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

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

        req._user = {
            ...decoded,
            name: user.name,
            status: user.status,
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
