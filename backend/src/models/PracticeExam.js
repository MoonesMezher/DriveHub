const mongoose = require('mongoose');

const practiceAnswerSchema = new mongoose.Schema(
    {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedAnswer: { type: String, default: null },
        isCorrect: { type: Boolean, default: false },
    },
    { _id: false }
);

const practiceExamSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', default: null },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        score: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        attempt: { type: Number, default: 1 },
        durationSeconds: { type: Number, default: 0 },
        questionIds: [{ type: mongoose.Schema.Types.ObjectId }],
        answers: [practiceAnswerSchema],
        showAnswersAfterFinish: { type: Boolean, default: true },
        completedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PracticeExam', practiceExamSchema);
