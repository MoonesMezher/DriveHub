const mongoose = require('mongoose');

const schoolApplicationSchema = new mongoose.Schema(
    {
        applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolName: { type: String, required: true, trim: true },
        address: { type: String, required: true },
        governorate: { type: String, trim: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        licenses: [{ type: String }],
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        bankAccount: { type: String, select: false },
        documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DocumentUpload' }],
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        rejectionReason: { type: String, default: null },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        createdSchoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SchoolApplication', schoolApplicationSchema);
