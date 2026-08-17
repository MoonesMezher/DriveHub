const config = require('../config');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { User, UserRole } = require('../models');
const passwordService = require('../utils/passwordService');
const { ROLES } = require('../constants/roles');

/**
 * Create or refresh the platform admin from ADMIN_* env vars.
 * Idempotent: safe to re-run (updates password/name/phone when the user already exists).
 */
const ensureAdmin = async () => {
    const { admin } = config;

    if (!admin.email || !admin.password) {
        throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in .env');
    }

    const email = String(admin.email).toLowerCase().trim();
    let user = await User.findOne({ email });
    const hashed = await passwordService.hashPassword(admin.password);

    if (!user) {
        user = await User.create({
            name: admin.username || 'Platform Admin',
            email,
            phone: admin.phone || '+963000000000',
            password: hashed,
            activeContext: { role: ROLES.ADMIN },
        });
        console.log('Admin created:', user.email);
    } else {
        user.name = admin.username || user.name || 'Platform Admin';
        if (admin.phone) user.phone = admin.phone;
        user.password = hashed;
        user.activeContext = { role: ROLES.ADMIN };
        user.status = 'active';
        await user.save();
        console.log('Admin refreshed:', user.email);
    }

    await UserRole.findOneAndUpdate(
        { userId: user._id, role: ROLES.ADMIN, schoolId: null },
        {
            userId: user._id,
            role: ROLES.ADMIN,
            schoolId: null,
            status: 'active',
        },
        { upsert: true, new: true },
    );

    return user;
};

const adminSeed = async ({ disconnect = true } = {}) => {
    await connectDatabase();
    try {
        return await ensureAdmin();
    } finally {
        if (disconnect) await disconnectDatabase();
    }
};

if (require.main === module) {
    adminSeed()
        .then(() => process.exit(0))
        .catch(async (err) => {
            console.error('Seed error:', err.message);
            await disconnectDatabase().catch(() => {});
            process.exit(1);
        });
}

module.exports = { adminSeed, ensureAdmin };
