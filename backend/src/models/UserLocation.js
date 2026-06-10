const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        sessionId: { type: String, default: null },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        source: { type: String, enum: ['gps', 'manual', 'ip'], default: 'gps' },
        accuracy: { type: Number, default: null },
        governorate: { type: String, default: null },
    },
    { timestamps: true }
);

userLocationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('UserLocation', userLocationSchema);
