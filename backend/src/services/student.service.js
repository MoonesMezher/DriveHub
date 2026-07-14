const {
    Enrollment,
    EnrollmentArchive,
    StudentStatistics,
    PracticalLesson,
    Notification,
    PracticeExam,
    TrainingCourse,
    TrafficExamSchedule,
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
        let courseLaunch = null;
        let upcomingExam = null;

        if (enrollment) {
            statistics = await StudentStatistics.findOne({ enrollmentId: enrollment._id }).lean();
            const course = enrollment.courseId
                ? await TrainingCourse.findById(enrollment.courseId).select('endDate launchDate durationDays status categoryCode').lean()
                : null;
            if (course) {
                if (course.launchDate) {
                    courseLaunch = {
                        launchDate: course.launchDate,
                        categoryCode: course.categoryCode,
                        status: course.status,
                    };
                }
                const endDate = course.endDate
                    || (course.launchDate
                        ? new Date(new Date(course.launchDate).getTime() + (course.durationDays || 0) * 86400000)
                        : null);
                if (endDate) {
                    const diffMs = endDate.getTime() - Date.now();
                    courseDaysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
                }
            }

            upcomingExam = await TrafficExamSchedule.findOne({
                studentId: userId,
                status: 'scheduled',
                visibleToStudent: true,
                examDate: { $gte: new Date(Date.now() - 86400000) },
            })
                .sort({ examDate: 1 })
                .lean();
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
                    paymentDeadline: enrollment.paymentDeadline,
                }
                : null,
            statistics,
            courseDaysRemaining,
            courseLaunch,
            upcomingExam,
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

        const lessonsCompleted = await PracticalLesson.countDocuments({
            studentId: userId,
            enrollmentId: enrollment._id,
            status: 'completed',
        });

        const verificationService = require('./verification.service');
        let statsDoc = await StudentStatistics.findOne({ enrollmentId: enrollment._id });
        if (!statsDoc) {
            statsDoc = await StudentStatistics.create({
                userId,
                enrollmentId: enrollment._id,
                progressPercent: 0,
                lessonsCompleted,
            });
        } else if (!statsDoc.userId) {
            statsDoc.userId = userId;
            await statsDoc.save();
        }

        const statistics = statsDoc.toObject();
        const practiceCount = await PracticeExam.countDocuments({ userId, enrollmentId: enrollment._id });

        const verification = await verificationService.ensureStatisticsToken(enrollment._id);

        return {
            enrollment: {
                id: enrollment._id,
                status: enrollment.status,
                categoryCode: enrollment.categoryCode,
            },
            statistics: {
                progressPercent: statistics.progressPercent ?? 0,
                practiceScores: statistics.practiceScores ?? [],
                lessonsCompleted: statistics.lessonsCompleted ?? lessonsCompleted,
                lessonsTotal: statistics.lessonsTotal ?? 0,
                attendancePercent: statistics.attendancePercent ?? 0,
                averageLessonRating: statistics.averageLessonRating ?? null,
            },
            practiceCount,
            lessonsCompleted,
            verification: verification || null,
        };
    }
}

module.exports = new StudentService();
