const mongoose = require('mongoose');
const { REQUIREMENT_SECTIONS, REQUIREMENT_SECTION_VALUES } = require('../constants/requirementSections');

const requirementItemSchema = new mongoose.Schema(
    {
        section: {
            type: String,
            enum: REQUIREMENT_SECTION_VALUES,
            default: REQUIREMENT_SECTIONS.DOCUMENTS,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        icon: { type: String, default: '', trim: true },
        category: { type: String, default: '', trim: true },
        imageUrl: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true },
);

requirementItemSchema.index({ section: 1, isActive: 1, order: 1 });
requirementItemSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('RequirementItem', requirementItemSchema);
