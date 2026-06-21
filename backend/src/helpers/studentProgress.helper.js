const {
    StudentStatistics,
    PracticalLesson,
    PracticeExam,
    ContentUnlockMode,
} = require('../models');
const { RETAKE_SCOPE } = require('../constants/enrollmentStatus');

const resetStudentProgress = async (enrollmentId, userId, scope) => {
    if (scope === RETAKE_SCOPE.FULL) {
        await Promise.all([
            StudentStatistics.findOneAndUpdate(
                { enrollmentId },
                {
                    progressPercent: 0,
                    practiceScores: [],
                    lessonsCompleted: 0,
                    lessonsTotal: 0,
                    averageLessonRating: null,
                    attendancePercent: 0,
                },
                { upsert: true },
            ),
            ContentUnlockMode.deleteMany({ userId, enrollmentId }),
            PracticeExam.deleteMany({ userId, enrollmentId }),
            PracticalLesson.deleteMany({ enrollmentId }),
        ]);
        return { scope, reset: ['statistics', 'practice', 'lessons', 'unlock'] };
    }

    await Promise.all([
        StudentStatistics.findOneAndUpdate(
            { enrollmentId },
            {
                lessonsCompleted: 0,
                lessonsTotal: 0,
                averageLessonRating: null,
            },
            { upsert: true },
        ),
        PracticalLesson.deleteMany({ enrollmentId }),
    ]);
    return { scope, reset: ['lessons'] };
};

module.exports = { resetStudentProgress };
