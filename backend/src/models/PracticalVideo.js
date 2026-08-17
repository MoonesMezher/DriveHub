const mongoose = require('mongoose');

const practicalVideoSchema = new mongoose.Schema(
    {
        categoryCode: { type: String, required: true, index: true },
        subTypeCode: { type: String, default: null },
        phase: { type: Number, required: true, min: 0 },
        title: { type: String, required: true, trim: true },
        url: { type: String, required: true },
        durationSeconds: { type: Number },
        order: { type: Number, default: 0 },
        thumbnailUrl: { type: String, default: null },
        isSample: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PracticalVideo', practicalVideoSchema);
