const config = require('../config');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { User, UserRole } = require('../models');
const passwordService = require('../utils/passwordService');
const { ROLES } = require('../constants/roles');

const adminSeed = async () => {
    const { admin } = config;

    if (!admin.email || !admin.password) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in .env');
    }

    await connectDatabase();

    const existing = await User.findOne({ email: admin.email });
    if (existing) {
        throw new Error('Admin already exists');
    }

    const user = await User.create({
        name: admin.username || 'Platform Admin',
        email: admin.email,
        phone: admin.phone,
        password: await passwordService.hashPassword(admin.password),
        activeContext: { role: ROLES.ADMIN },
    });

    await UserRole.create({
        userId: user._id,
        role: ROLES.ADMIN,
    });

    console.log('Admin created:', user.email);
};

adminSeed()
    .then(async () => {
        await disconnectDatabase();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('Seed error:', err.message);
        await disconnectDatabase();
        process.exit(1);
    });
