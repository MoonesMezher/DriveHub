/**
 * Retake payment cycle: 3×50% then 100%, repeating.
 * attempt 1,2,3 → 50% | attempt 4,8,12... → 100%
 */
const getRetakePaymentPercentage = (attemptNumber) => {
    if (!attemptNumber || attemptNumber < 1) {
        return 100;
    }
    return attemptNumber % 4 === 0 ? 100 : 50;
};

const calculateRetakeAmount = (basePrice, attemptNumber) => {
    const percentage = getRetakePaymentPercentage(attemptNumber);
    return Math.round((basePrice * percentage) / 100);
};

module.exports = { getRetakePaymentPercentage, calculateRetakeAmount };
