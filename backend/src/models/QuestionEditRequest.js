const mongoose = require('mongoose');

const questionEditRequestSchema = new mongoose.Schema(
    {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank', required: true },
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reviewNote: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('QuestionEditRequest', questionEditRequestSchema);
