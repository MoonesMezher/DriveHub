const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        imageUrl: { type: String, default: null },
        link: { type: String, default: null },
        placement: { type: String, enum: ['home', 'student', 'sidebar', 'banner'], default: 'home' },
        status: { type: String, enum: ['draft', 'active', 'paused', 'expired'], default: 'draft' },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
