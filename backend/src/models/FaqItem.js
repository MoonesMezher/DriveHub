const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema(
    {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        category: { type: String, default: '', trim: true },
        linkUrl: { type: String, default: '', trim: true },
        linkLabel: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true },
);

faqItemSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('FaqItem', faqItemSchema);
