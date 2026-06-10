const mongoose = require('mongoose');

const trainingDataEditSchema = new mongoose.Schema(
    {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', default: null },
        coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        contentType: { type: String, enum: ['theory', 'shared', 'specific', 'video'], required: true },
        contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
        proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reviewNote: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TrainingDataEdit', trainingDataEditSchema);
