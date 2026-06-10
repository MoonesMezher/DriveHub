const { enrollmentService } = require('../services');
const logger = require('../utils/logger');

const expireAwaitingPaymentEnrollments = async () => {
    try {
        const count = await enrollmentService.expireAwaitingPayment();
        if (count > 0) {
            logger.info('job.expirePayments.completed', { expiredCount: count });
        }
    } catch (err) {
        logger.error('job.expirePayments.failed', { message: err.message });
    }
};

module.exports = { expireAwaitingPaymentEnrollments };
