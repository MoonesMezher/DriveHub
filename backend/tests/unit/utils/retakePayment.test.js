const { getRetakePaymentPercentage, calculateRetakeAmount } = require('../../../src/utils/retakePayment');

describe('retakePayment', () => {
    describe('getRetakePaymentPercentage', () => {
        it('returns 50% for attempts 1, 2, 3', () => {
            expect(getRetakePaymentPercentage(1)).toBe(50);
            expect(getRetakePaymentPercentage(2)).toBe(50);
            expect(getRetakePaymentPercentage(3)).toBe(50);
        });

        it('returns 100% every 4th attempt', () => {
            expect(getRetakePaymentPercentage(4)).toBe(100);
            expect(getRetakePaymentPercentage(8)).toBe(100);
        });

        it('repeats 50% cycle after 100% attempt', () => {
            expect(getRetakePaymentPercentage(5)).toBe(50);
            expect(getRetakePaymentPercentage(7)).toBe(50);
        });
    });

    describe('calculateRetakeAmount', () => {
        it('calculates half price on 50% attempts', () => {
            expect(calculateRetakeAmount(1000, 1)).toBe(500);
        });

        it('calculates full price on 100% attempts', () => {
            expect(calculateRetakeAmount(1000, 4)).toBe(1000);
        });
    });
});
