const mongoose = require('mongoose');

const drivingSchoolSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        address: { type: String, required: true },
        governorate: { type: String, trim: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        licenses: [{ type: String }],
        vehiclesCount: { type: Number, default: 0 },
        hasFemaleCoaches: { type: Boolean, default: false },
        bankAccount: { type: String, select: false },
        status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
        registrationPaused: { type: Boolean, default: false },
        preRegistrationEnabled: { type: Boolean, default: true },
        managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('DrivingSchool', drivingSchoolSchema);
