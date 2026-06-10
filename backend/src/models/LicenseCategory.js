const mongoose = require('mongoose');

const licenseCategorySchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        briefDesc: { type: String, default: '' },
        fullDesc: { type: String, default: '' },
        minAge: { type: Number, required: true },
        prerequisites: [{ type: String }],
        vehicleTypes: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('LicenseCategory', licenseCategorySchema);
