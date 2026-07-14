const mongoose = require('mongoose');

const prerequisiteSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        code: { type: String, default: '', uppercase: true, trim: true },
        isRequired: { type: Boolean, default: true },
        type: { type: String, enum: ['license', 'basic', 'medical'], default: 'license' },
    },
    { _id: false },
);

const licenseCategorySchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        briefDesc: { type: String, default: '' },
        fullDesc: { type: String, default: '' },
        requirementsIntro: { type: String, default: 'ما تحتاجه قبل التقديم' },
        minAge: { type: Number, required: true },
        prerequisites: [prerequisiteSchema],
        vehicleTypes: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('LicenseCategory', licenseCategorySchema);
