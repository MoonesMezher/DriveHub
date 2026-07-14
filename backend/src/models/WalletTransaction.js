const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: ['admin_credit', 'enrollment_payment', 'refund'],
            required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        balanceAfter: { type: Number, required: true, min: 0 },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
        note: { type: String, trim: true, default: null },
    },
    { timestamps: true },
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
