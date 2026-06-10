const mongoose = require('mongoose');

const trainingContentSpecificSchema = new mongoose.Schema(
    {
        categoryCode: { type: String, required: true, index: true },
        subTypeCode: { type: String, default: null },
        section: { type: String, enum: ['mechanics', 'vehicle_ops', 'maintenance'], default: 'mechanics' },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        order: { type: Number, default: 0 },
        mediaUrl: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TrainingContentSpecific', trainingContentSpecificSchema);
