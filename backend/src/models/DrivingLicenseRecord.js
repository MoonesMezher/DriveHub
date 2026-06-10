const mongoose = require('mongoose');

const drivingLicenseRecordSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        issueDate: { type: Date, required: true },
        issuer: { type: String, default: 'وزارة النقل' },
        certificateNumber: { type: String, default: null },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

drivingLicenseRecordSchema.index({ userId: 1, categoryCode: 1 });

module.exports = mongoose.model('DrivingLicenseRecord', drivingLicenseRecordSchema);
