const cron = require('node-cron');
const logger = require('../utils/logger');
const { expireAwaitingPaymentEnrollments } = require('./expirePayments.job');
const { remindExamTomorrow } = require('./remindExamTomorrow.job');
const { remindPaymentDeadline } = require('./remindPaymentDeadline.job');

const registerJobs = () => {
    if (process.env.NODE_ENV === 'test') return;

    // كل ساعة: انتهاء مهلة الدفع + ترقية قائمة الانتظار
    cron.schedule('0 * * * *', () => {
        expireAwaitingPaymentEnrollments();
    });

    // يومياً 08:00: تذكير امتحان الغد + مهلة الدفع خلال 24 ساعة
    cron.schedule('0 8 * * *', () => {
        remindExamTomorrow();
        remindPaymentDeadline();
    });

    logger.info('jobs.scheduler.started');
};

module.exports = { registerJobs };
