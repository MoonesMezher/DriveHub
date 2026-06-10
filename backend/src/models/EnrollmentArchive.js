const mongoose = require('mongoose');

const enrollmentArchiveSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        preservedData: { type: mongoose.Schema.Types.Mixed, default: {} },
        reason: { type: String, enum: ['retake', 're_enroll', 'admin'], default: 're_enroll' },
        archivedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EnrollmentArchive', enrollmentArchiveSchema);
