const { Enrollment, User, Notification } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const logger = require('../utils/logger');

const remindPaymentDeadline = async () => {
    try {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const enrollments = await Enrollment.find({
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: { $gt: now, $lte: in24h },
        }).lean();

        if (!enrollments.length) return 0;

        const notificationService = require('../services/notification.service');
        let sent = 0;

        for (const enrollment of enrollments) {
            const alreadySent = await Notification.exists({
                userId: enrollment.userId,
                type: NOTIFICATION_TYPES.PAYMENT_REMINDER,
                'data.enrollmentId': enrollment._id,
                createdAt: { $gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
            });
            if (alreadySent) continue;

            const student = await User.findById(enrollment.userId).select('email phone').lean();
            const deadlineStr = new Date(enrollment.paymentDeadline).toLocaleDateString('ar-SY');
            const message = `تذكير: أكمل الدفع قبل ${deadlineStr} لتأكيد حجزك.`;

            await notificationService.send({
                userId: enrollment.userId,
                type: NOTIFICATION_TYPES.PAYMENT_REMINDER,
                title: 'تذكير بمهلة الدفع',
                message,
                data: { enrollmentId: enrollment._id, paymentDeadline: enrollment.paymentDeadline },
                channels: ['in_app', 'email', 'sms'],
                email: student?.email,
                phone: student?.phone,
            });
            sent += 1;
        }

        if (sent > 0) {
            logger.info('job.remindPaymentDeadline.completed', { sent });
        }
        return sent;
    } catch (err) {
        logger.error('job.remindPaymentDeadline.failed', { message: err.message });
        return 0;
    }
};

module.exports = { remindPaymentDeadline };
