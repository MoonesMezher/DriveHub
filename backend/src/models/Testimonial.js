const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        role: { type: String, default: '', trim: true },
        quote: { type: String, required: true, trim: true },
        rating: { type: Number, default: null, min: 1, max: 5 },
        avatar: { type: String, default: '', trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true },
);

testimonialSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
