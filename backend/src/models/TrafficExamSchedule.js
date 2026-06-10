const mongoose = require('mongoose');

const trafficExamScheduleSchema = new mongoose.Schema(
    {
        governorate: { type: String, required: true, index: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
        examType: { type: String, enum: ['theory', 'practical'], required: true },
        examDate: { type: Date, required: true },
        branch: { type: String, required: true, trim: true },
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
        scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reminderSent: { type: Boolean, default: false },
        visibleToStudent: { type: Boolean, default: true },
    },
    { timestamps: true }
);

trafficExamScheduleSchema.index({ studentId: 1, examDate: 1 });

module.exports = mongoose.model('TrafficExamSchedule', trafficExamScheduleSchema);
