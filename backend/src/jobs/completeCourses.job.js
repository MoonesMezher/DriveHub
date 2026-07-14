const { Enrollment, TrainingCourse } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { sendInstant } = require('../helpers/notificationDelivery.helper');
const logger = require('../utils/logger');

/** Move active enrollments to completed after the 15-day training window ends. */
const completeCourses = async () => {
    try {
        const now = new Date();
        const courses = await TrainingCourse.find({
            status: COURSE_STATUS.ACTIVE,
            endDate: { $lte: now },
        }).lean();

        if (!courses.length) return 0;

        let updated = 0;

        for (const course of courses) {
            const activeEnrollments = await Enrollment.find({
                courseId: course._id,
                status: ENROLLMENT_STATUS.ACTIVE,
            }).select('userId').lean();

            for (const row of activeEnrollments) {
                await Enrollment.updateOne(
                    { _id: row._id },
                    { status: ENROLLMENT_STATUS.COMPLETED },
                );
                updated += 1;

                await sendInstant(row.userId, {
                    type: NOTIFICATION_TYPES.GENERAL,
                    title: 'اكتملت مدة التدريب',
                    message: 'انتهت مدة الدورة (15 يوماً). ستُرسل قائمتك لإدارة المرور لتحديد موعد الامتحان.',
                    data: { courseId: course._id, enrollmentId: row._id },
                });
            }

            await TrainingCourse.updateOne(
                { _id: course._id },
                { status: COURSE_STATUS.COMPLETED },
            );
        }

        if (updated > 0) {
            logger.info('job.completeCourses.completed', { updated, courses: courses.length });
        }
        return updated;
    } catch (err) {
        logger.error('job.completeCourses.failed', { message: err.message });
        return 0;
    }
};

module.exports = { completeCourses };
