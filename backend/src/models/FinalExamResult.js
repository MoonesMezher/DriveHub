const mongoose = require('mongoose');

const finalExamResultSchema = new mongoose.Schema(
    {
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true },
        theoryScore: { type: Number, default: null, min: 0, max: 100 },
        practicalScore: { type: Number, default: null, min: 0, max: 100 },
        theoryPassed: { type: Boolean, default: null },
        practicalPassed: { type: Boolean, default: null },
        finalStatus: {
            type: String,
            enum: ['pending', 'theory_passed', 'final_passed', 'final_failed_theory', 'final_failed_practical'],
            default: 'pending',
        },
        retakeScope: { type: String, enum: ['full', 'practical_only'], default: null },
        attemptNumber: { type: Number, default: 1 },
        enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        theoryAt: { type: Date, default: null },
        practicalAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('FinalExamResult', finalExamResultSchema);
