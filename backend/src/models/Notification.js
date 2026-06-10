const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true },
        body: { type: String, default: null },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        suggestions: [{ type: String }],
        read: { type: Boolean, default: false, index: true },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
