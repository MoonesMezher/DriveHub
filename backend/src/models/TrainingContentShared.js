const mongoose = require('mongoose');

const trainingContentSharedSchema = new mongoose.Schema(
    {
        section: { type: String, enum: ['signs', 'rules', 'safety'], required: true },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        order: { type: Number, default: 0 },
        mediaUrl: { type: String, default: null },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TrainingContentShared', trainingContentSharedSchema);
