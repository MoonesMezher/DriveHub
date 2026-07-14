const { User } = require('../models');
const { ROLES } = require('../constants/roles');
const notificationService = require('../services/notification.service');

/** External notifications: email only (SMS disabled until provider is configured). */
const INSTANT_CHANNELS = ['in_app', 'email'];

async function sendInstant(userId, payload) {
    const user = await User.findById(userId).select('email phone').lean();
    return notificationService.send({
        userId,
        ...payload,
        channels: INSTANT_CHANNELS,
        email: user?.email || null,
        phone: user?.phone || null,
    });
}

async function notifySchoolManagers(schoolId, payload) {
    const { UserRole } = require('../models');
    const managers = await UserRole.find({
        schoolId,
        role: ROLES.MANAGER,
        status: 'active',
    }).select('userId').lean();

    const results = [];
    for (const row of managers) {
        results.push(await sendInstant(row.userId, payload));
    }
    return results;
}

module.exports = { sendInstant, notifySchoolManagers, INSTANT_CHANNELS };
