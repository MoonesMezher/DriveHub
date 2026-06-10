const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('./ApiError');
const { ERR } = require('../constants/errorMessages');

const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
};

class JwtService {
    generateAccessToken(payload) {
        return jwt.sign(
            { ...payload, type: TOKEN_TYPES.ACCESS, jti: crypto.randomUUID() },
            config.jwt.accessSecret,
            { expiresIn: config.jwt.accessExpiresIn },
        );
    }

    generateRefreshToken(payload) {
        return jwt.sign(
            {
                userId: payload.userId,
                type: TOKEN_TYPES.REFRESH,
                jti: crypto.randomUUID(),
            },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn },
        );
    }

    generateToken(payload) {
        return this.generateAccessToken(payload);
    }

    verifyAccessToken(token) {
        const decoded = jwt.verify(token, config.jwt.accessSecret);
        if (decoded.type !== TOKEN_TYPES.ACCESS) {
            throw new ApiError(401, ERR.INVALID_TOKEN_TYPE);
        }
        return decoded;
    }

    verifyRefreshToken(token) {
        const decoded = jwt.verify(token, config.jwt.refreshSecret);
        if (decoded.type !== TOKEN_TYPES.REFRESH) {
            throw new ApiError(401, ERR.INVALID_REFRESH_TOKEN);
        }
        return decoded;
    }

    verifyToken(token) {
        return this.verifyAccessToken(token);
    }

    getRefreshExpiryDate() {
        const match = String(config.jwt.refreshExpiresIn).match(/^(\d+)([dhms])$/);
        if (!match) {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        return new Date(Date.now() + value * multipliers[unit]);
    }
}

module.exports = new JwtService();
module.exports.TOKEN_TYPES = TOKEN_TYPES;
