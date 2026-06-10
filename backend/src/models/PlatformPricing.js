const mongoose = require('mongoose');

const platformPricingSchema = new mongoose.Schema(
    {
        categoryCode: { type: String, required: true, uppercase: true, trim: true },
        subTypeCode: { type: String, default: null },
        fixedPrice: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'SYP' },
        effectiveFrom: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

platformPricingSchema.index({ categoryCode: 1, subTypeCode: 1, isActive: 1 });

module.exports = mongoose.model('PlatformPricing', platformPricingSchema);
