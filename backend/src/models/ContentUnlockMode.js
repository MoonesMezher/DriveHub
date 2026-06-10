const mongoose = require('mongoose');

const contentUnlockModeSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        categoryCode: { type: String, required: true },
        mode: { type: String, enum: ['progressive', 'full'], default: 'progressive' },
        unlockedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

contentUnlockModeSchema.index({ userId: 1, categoryCode: 1 }, { unique: true });

module.exports = mongoose.model('ContentUnlockMode', contentUnlockModeSchema);
