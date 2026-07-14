const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        codeHash: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: true },
        consumedAt: { type: Date, default: null, index: true },
        attemptCount: { type: Number, default: 0, min: 0 },
        maxAttempts: { type: Number, default: 5, min: 1 },
        lastRequestedAt: { type: Date, default: Date.now },
        resetTokenHash: { type: String, default: null },
        resetTokenExpiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

passwordResetTokenSchema.index({ email: 1, consumedAt: 1, expiresAt: -1 });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
