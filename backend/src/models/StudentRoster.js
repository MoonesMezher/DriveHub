const mongoose = require('mongoose');

const studentRosterSchema = new mongoose.Schema(
    {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCourse', required: true },
        studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        enrollmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }],
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        submittedAt: { type: Date, default: null },
        status: { type: String, enum: ['draft', 'submitted', 'distributed'], default: 'draft' },
        trafficBatchId: { type: String, default: null },
        qrCode: { type: String, default: null },
        verificationToken: { type: String, default: null, index: true },
        qrPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { timestamps: true }
);

studentRosterSchema.index({ courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentRoster', studentRosterSchema);
