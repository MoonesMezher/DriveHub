const config = require('../config');

const DEFAULT_COMMISSION = 0.02;

const splitPayment = (amount, commissionRate = config.platform?.commission ?? DEFAULT_COMMISSION) => {
    const platformShare = Math.round(amount * commissionRate * 100) / 100;
    const schoolShare = Math.round((amount - platformShare) * 100) / 100;
    return { amount, schoolShare, platformShare, commissionRate };
};

module.exports = { splitPayment, DEFAULT_COMMISSION };
