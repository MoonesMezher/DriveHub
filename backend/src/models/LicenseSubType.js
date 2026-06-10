const mongoose = require('mongoose');

const licenseSubTypeSchema = new mongoose.Schema(
    {
        parentCode: { type: String, required: true, uppercase: true, trim: true, index: true },
        subCode: { type: String, required: true, uppercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        transmissionType: { type: String, enum: ['manual', 'automatic'], required: true },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

licenseSubTypeSchema.index({ parentCode: 1, subCode: 1 }, { unique: true });

module.exports = mongoose.model('LicenseSubType', licenseSubTypeSchema);
