const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        adminStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        moderatedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

reviewSchema.index({ reviewerId: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
