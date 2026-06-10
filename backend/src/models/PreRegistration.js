const mongoose = require('mongoose');

const preRegistrationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        nextCourseSlot: { type: Date, default: null },
        status: { type: String, enum: ['reserved', 'converted', 'cancelled'], default: 'reserved' },
        reservedAt: { type: Date, default: Date.now },
        convertedEnrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
    },
    { timestamps: true }
);

preRegistrationSchema.index({ userId: 1, schoolId: 1, categoryCode: 1, status: 1 });

module.exports = mongoose.model('PreRegistration', preRegistrationSchema);
