const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema(
    {
        storedName: { type: String, required: true },
        mime: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        category: {
            type: String,
            enum: ['ad', 'content', 'question', 'thumbnail', 'general'],
            default: 'general',
        },
        isPublic: { type: Boolean, default: true },
    },
    { timestamps: true },
);

module.exports = mongoose.model('MediaAsset', mediaAssetSchema);
