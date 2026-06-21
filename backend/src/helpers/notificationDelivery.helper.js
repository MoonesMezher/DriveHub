const { User } = require('../models');
const notificationService = require('../services/notification.service');

const INSTANT_CHANNELS = ['in_app', 'email', 'sms'];

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

module.exports = { sendInstant, INSTANT_CHANNELS };
