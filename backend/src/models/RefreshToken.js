const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: true },
        revokedAt: { type: Date, default: null },
        replacedByTokenHash: { type: String, default: null },
        userAgent: { type: String, default: null },
    },
    { timestamps: true }
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

refreshTokenSchema.methods.isValid = function isValid() {
    return !this.revokedAt && this.expiresAt > new Date();
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
