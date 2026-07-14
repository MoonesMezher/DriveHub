const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true },
        amount: { type: Number, required: true },
        schoolShare: { type: Number, required: true },
        platformShare: { type: Number, required: true },
        commissionRate: { type: Number, default: 0.02 },
        type: { type: String, enum: ['initial', 'retake'], default: 'initial' },
        retakeAttempt: { type: Number, default: 0 },
        retakePercentage: { type: Number, default: null },
        status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
        gateway: { type: String, default: null },
        gatewayRef: { type: String, default: null },
        studentReference: { type: String, default: null },
        studentClaimedAt: { type: Date, default: null },
        confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
