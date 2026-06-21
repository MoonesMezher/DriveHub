const mongoose = require('mongoose');

const sessionQuestionSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        text: { type: String, required: true },
        type: { type: String, default: 'mcq' },
        options: [{ key: String, text: String }],
        imageUrl: { type: String, default: null },
        difficulty: { type: String, default: null },
        sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    { _id: false },
);

const practiceExamSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', default: null },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        attempt: { type: Number, default: 1 },
        durationSeconds: { type: Number, required: true },
        questionIds: [{ type: mongoose.Schema.Types.ObjectId }],
        questions: [sessionQuestionSchema],
        status: { type: String, enum: ['active', 'submitted', 'expired'], default: 'active', index: true },
        startedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true, index: true },
        submittedAt: { type: Date, default: null },
        practiceExamId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeExam', default: null },
    },
    { timestamps: true },
);

practiceExamSessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('PracticeExamSession', practiceExamSessionSchema);
