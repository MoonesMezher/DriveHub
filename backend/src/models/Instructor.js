const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        licenseCategories: [{ type: String }],
        gender: { type: String, enum: ['male', 'female'], default: 'male' },
        isFemaleCoach: { type: Boolean, default: false },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
        hiredAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

instructorSchema.index({ userId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Instructor', instructorSchema);
