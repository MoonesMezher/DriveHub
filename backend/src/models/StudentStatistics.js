const mongoose = require('mongoose');

const practiceScoreSchema = new mongoose.Schema(
    {
        examId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeExam' },
        score: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        takenAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const studentStatisticsSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
        progressPercent: { type: Number, default: 0, min: 0, max: 100 },
        practiceScores: [practiceScoreSchema],
        attendancePercent: { type: Number, default: 0, min: 0, max: 100 },
        lessonsCompleted: { type: Number, default: 0 },
        lessonsTotal: { type: Number, default: 0 },
        averageLessonRating: { type: Number, default: null },
        verificationToken: { type: String, default: null, index: true },
        qrPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('StudentStatistics', studentStatisticsSchema);
