const { Notification } = require('../models');
const logger = require('../utils/logger');
const channels = require('./notificationChannels');

class NotificationService {
    async send({
        userId,
        type,
        title,
        message,
        body,
        data = {},
        suggestions = [],
        channels: channelList = ['in_app'],
        email = null,
        phone = null,
    }) {
        let notification = null;

        if (channelList.includes('in_app')) {
            notification = await Notification.create({
                userId,
                type,
                title,
                message,
                body: body || message,
                data,
                suggestions,
            });
        }

        const externalChannels = channelList.filter((c) => c === 'email');
        for (const channel of externalChannels) {
            await channels.dispatch(channel, { to: email, subject: title, text: message });
        }

        logger.info('notification.sent', { userId, type, title, channels: channelList });
        return notification;
    }

    async sendBulk(recipients, payload) {
        const docs = recipients.map((userId) => ({ ...payload, userId }));
        return Notification.insertMany(docs);
    }

    async listForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
        const filter = { userId };
        if (unreadOnly) filter.read = false;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Notification.countDocuments(filter),
        ]);
        return { items, total, page, limit };
    }

    async markRead(notificationId, userId) {
        return Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true, readAt: new Date() },
            { new: true },
        );
    }

    async markAllRead(userId) {
        return Notification.updateMany(
            { userId, read: false },
            { read: true, readAt: new Date() },
        );
    }
}

module.exports = new NotificationService();
