const {
    Enrollment,
    EnrollmentArchive,
    StudentStatistics,
    PracticalLesson,
    Notification,
    PracticeExam,
    TrainingCourse,
} = require('../models');
const { getActiveEnrollment } = require('../helpers/enrollment.helper');

class StudentService {
    async getDashboard(userId) {
        const [enrollment, unreadCount, upcomingLesson, recentPractice] = await Promise.all([
            getActiveEnrollment(userId),
            Notification.countDocuments({ userId, read: false }),
            PracticalLesson.findOne({
                studentId: userId,
                status: 'scheduled',
                scheduledAt: { $gte: new Date() },
            })
                .sort({ scheduledAt: 1 })
                .populate('coachId', 'name')
                .lean(),
            PracticeExam.findOne({ userId }).sort({ completedAt: -1 }).lean(),
        ]);

        let statistics = null;
        let courseDaysRemaining = null;
        if (enrollment) {
            statistics = await StudentStatistics.findOne({ enrollmentId: enrollment._id }).lean();
            const course = enrollment.courseId
                ? await TrainingCourse.findById(enrollment.courseId).select('endDate launchDate durationDays').lean()
                : null;
            if (course) {
                const endDate = course.endDate
                    || (course.launchDate
                        ? new Date(new Date(course.launchDate).getTime() + (course.durationDays || 0) * 86400000)
                        : null);
                if (endDate) {
                    const diffMs = endDate.getTime() - Date.now();
                    courseDaysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
                }
            }
        }

        return {
            enrollment: enrollment
                ? {
                    id: enrollment._id,
                    status: enrollment.status,
                    categoryCode: enrollment.categoryCode,
                    subTypeCode: enrollment.subTypeCode,
                    school: enrollment.schoolId,
                    course: enrollment.courseId,
                }
                : null,
            statistics,
            courseDaysRemaining,
            unreadNotifications: unreadCount,
            upcomingLesson,
            lastPractice: recentPractice,
        };
    }

    async getArchive(userId) {
        return EnrollmentArchive.find({ userId })
            .sort({ archivedAt: -1 })
            .populate('schoolId', 'name')
            .lean();
    }

    async getStatistics(userId) {
        const enrollment = await getActiveEnrollment(userId);
        if (!enrollment) {
            return {
                enrollment: null,
                statistics: null,
                enrollmentsCount: await Enrollment.countDocuments({ userId }),
            };
        }

        const statistics = await StudentStatistics.findOne({ enrollmentId: enrollment._id }).lean();
        const practiceCount = await PracticeExam.countDocuments({ userId, enrollmentId: enrollment._id });
        const lessonsCompleted = await PracticalLesson.countDocuments({
            studentId: userId,
            enrollmentId: enrollment._id,
            status: 'completed',
        });

        return {
            enrollment: {
                id: enrollment._id,
                status: enrollment.status,
                categoryCode: enrollment.categoryCode,
            },
            statistics: statistics || {
                progressPercent: 0,
                practiceScores: [],
                lessonsCompleted,
                lessonsTotal: 0,
            },
            practiceCount,
            lessonsCompleted,
        };
    }
}

module.exports = new StudentService();
