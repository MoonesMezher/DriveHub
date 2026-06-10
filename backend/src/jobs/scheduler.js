const cron = require('node-cron');
const logger = require('../utils/logger');
const { expireAwaitingPaymentEnrollments } = require('./expirePayments.job');

const registerJobs = () => {
    if (process.env.NODE_ENV === 'test') return;

    // كل ساعة: انتهاء مهلة الدفع + ترقية قائمة الانتظار
    cron.schedule('0 * * * *', () => {
        expireAwaitingPaymentEnrollments();
    });

    logger.info('jobs.scheduler.started');
};

module.exports = { registerJobs };
