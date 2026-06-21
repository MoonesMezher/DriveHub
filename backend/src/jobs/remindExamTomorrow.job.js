const { TrafficExamSchedule, User } = require('../models');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const logger = require('../utils/logger');

const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const remindExamTomorrow = async () => {
    try {
        const tomorrowStart = startOfDay(new Date());
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

        const schedules = await TrafficExamSchedule.find({
            status: 'scheduled',
            reminderSent: false,
            examDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
        }).lean();

        if (!schedules.length) return 0;

        const notificationService = require('../services/notification.service');
        let sent = 0;

        for (const schedule of schedules) {
            const student = await User.findById(schedule.studentId).select('email phone name').lean();
            const examLabel = schedule.examType === 'practical' ? 'العملي' : 'النظري';
            const dateStr = new Date(schedule.examDate).toLocaleDateString('ar-SY');
            const message = `تذكير: امتحان ${examLabel} غداً (${dateStr}) — ${schedule.branch}`;

            await notificationService.send({
                userId: schedule.studentId,
                type: NOTIFICATION_TYPES.EXAM_REMINDER,
                title: 'تذكير بموعد الامتحان',
                message,
                data: { scheduleId: schedule._id, examDate: schedule.examDate },
                channels: ['in_app', 'email', 'sms'],
                email: student?.email,
                phone: student?.phone,
            });

            await TrafficExamSchedule.updateOne({ _id: schedule._id }, { reminderSent: true });
            sent += 1;
        }

        if (sent > 0) {
            logger.info('job.remindExamTomorrow.completed', { sent });
        }
        return sent;
    } catch (err) {
        logger.error('job.remindExamTomorrow.failed', { message: err.message });
        return 0;
    }
};

module.exports = { remindExamTomorrow };
