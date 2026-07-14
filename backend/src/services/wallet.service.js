const { User, WalletTransaction } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

class WalletService {
    async getWallet(userId, { page = 1, limit = 20 } = {}) {
        const user = await User.findById(userId).select('name email walletBalance').lean();
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const skip = (Math.max(Number(page) || 1, 1) - 1) * safeLimit;

        const [transactions, total] = await Promise.all([
            WalletTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean(),
            WalletTransaction.countDocuments({ userId }),
        ]);

        return {
            user: { _id: user._id, name: user.name, email: user.email },
            balance: user.walletBalance ?? 0,
            transactions,
            page: Math.max(Number(page) || 1, 1),
            limit: safeLimit,
            total,
        };
    }

    async getBalance(userId) {
        const user = await User.findById(userId).select('walletBalance').lean();
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);
        return user.walletBalance ?? 0;
    }

    async creditUser({ userId, amount, adminId, note = null }) {
        const creditAmount = Number(amount);
        if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
            throw new ApiError(400, ERR.WALLET_CREDIT_INVALID);
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: creditAmount } },
            { new: true, runValidators: true },
        );
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        const transaction = await WalletTransaction.create({
            userId,
            type: 'admin_credit',
            amount: creditAmount,
            balanceAfter: user.walletBalance,
            adminId,
            note: note?.trim() || null,
        });

        return { balance: user.walletBalance, transaction };
    }
}

module.exports = new WalletService();
