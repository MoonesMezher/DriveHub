const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    mongodbUrl: process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/drivehub',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || process.env.JWT_SECERET_KEY || 'change-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-refresh-secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET,
    },
    platform: {
        commission: Number(process.env.PLATFORM_COMMISSION) || 0.02,
    },
    admin: {
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        age: process.env.ADMIN_AGE,
        phone: process.env.ADMIN_PHONE,
    },
};

module.exports = config;
