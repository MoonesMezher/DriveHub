const mongoose = require('mongoose');

const trafficExamResultSchema = new mongoose.Schema(
    {
        scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrafficExamSchedule', default: null },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
        examType: { type: String, enum: ['theory', 'practical'], required: true },
        passed: { type: Boolean, required: true },
        score: { type: Number, default: null, min: 0, max: 100 },
        enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        resultDate: { type: Date, default: Date.now },
        notes: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TrafficExamResult', trafficExamResultSchema);
