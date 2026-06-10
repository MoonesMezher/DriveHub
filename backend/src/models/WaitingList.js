const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema(
    {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCourse', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        status: { type: String, enum: ['waiting', 'promoted', 'rejected', 'expired'], default: 'waiting' },
        position: { type: Number, default: 0 },
        promotedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

waitingListSchema.index({ courseId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WaitingList', waitingListSchema);
