const mongoose = require('mongoose');

const requirementItemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        icon: { type: String, default: '', trim: true },
        category: { type: String, default: '', trim: true },
        imageUrl: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true },
);

requirementItemSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('RequirementItem', requirementItemSchema);
