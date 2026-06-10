const {
    PracticalLesson,
    CoachNote,
    Instructor,
    Enrollment,
    User,
} = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const LESSONABLE_STATUSES = [
    ENROLLMENT_STATUS.PAID,
    ENROLLMENT_STATUS.ACTIVE,
    ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
];

class LessonService {
    async _assertCoachInSchool(coachId, schoolId) {
        const instructor = await Instructor.findOne({ userId: coachId, schoolId, status: 'active' });
        if (!instructor) throw new ApiError(400, ERR.COACH_NOT_IN_SCHOOL);
        return instructor;
    }

    _overlaps(existing, start, end) {
        const lessonStart = new Date(existing.scheduledAt);
        const lessonEnd = new Date(lessonStart.getTime() + existing.durationMinutes * 60 * 1000);
        return lessonStart < end && lessonEnd > start;
    }

    async _checkConflict({ coachId, studentId, scheduledAt, durationMinutes, excludeId = null }) {
        const start = new Date(scheduledAt);
        const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        const baseFilter = { status: 'scheduled', scheduledAt: { $lt: end } };
        if (excludeId) baseFilter._id = { $ne: excludeId };

        const [coachLessons, studentLessons] = await Promise.all([
            PracticalLesson.find({ ...baseFilter, coachId }).lean(),
            PracticalLesson.find({ ...baseFilter, studentId }).lean(),
        ]);

        const hasConflict = [...coachLessons, ...studentLessons].some((l) => this._overlaps(l, start, end));
        if (hasConflict) throw new ApiError(409, ERR.LESSON_CONFLICT);
    }

    async book(studentId, { enrollmentId, coachId, scheduledAt, durationMinutes = 60 }) {
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            userId: studentId,
            status: { $in: LESSONABLE_STATUSES },
        });
        if (!enrollment) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);

        await this._assertCoachInSchool(coachId, enrollment.schoolId);
        await this._checkConflict({
            coachId,
            studentId,
            scheduledAt,
            durationMinutes,
        });

        return PracticalLesson.create({
            enrollmentId,
            studentId,
            coachId,
            schoolId: enrollment.schoolId,
            scheduledAt,
            durationMinutes,
        });
    }

    async listStudentLessons(studentId, query = {}) {
        const filter = { studentId };
        if (query.status) filter.status = query.status;
        return PracticalLesson.find(filter)
            .sort({ scheduledAt: -1 })
            .populate('coachId', 'name')
            .limit(50)
            .lean();
    }

    async listCoachSchedule(coachId, query = {}) {
        const filter = { coachId };
        if (query.from) filter.scheduledAt = { $gte: new Date(query.from) };
        if (query.to) {
            filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(query.to) };
        }
        return PracticalLesson.find(filter)
            .sort({ scheduledAt: 1 })
            .populate('studentId', 'name email')
            .limit(100)
            .lean();
    }

    async complete(lessonId, coachId, { status = 'completed', rating = null, coachNotes = null }) {
        const lesson = await PracticalLesson.findOne({ _id: lessonId, coachId });
        if (!lesson) throw new ApiError(404, ERR.LESSON_NOT_FOUND);

        lesson.status = status;
        if (rating) lesson.rating = rating;
        if (coachNotes) lesson.coachNotes = coachNotes;
        await lesson.save();

        if (status === 'completed') {
            const { StudentStatistics } = require('../models');
            const stats = await StudentStatistics.findOne({ enrollmentId: lesson.enrollmentId });
            if (stats) {
                stats.lessonsCompleted = (stats.lessonsCompleted || 0) + 1;
                if (rating) {
                    const prev = stats.averageLessonRating || rating;
                    stats.averageLessonRating = Math.round(((prev + rating) / 2) * 10) / 10;
                }
                await stats.save();
            }
        }

        return lesson;
    }

    async addCoachNote(coachId, data) {
        await this._assertCoachInSchool(coachId, data.schoolId);
        return CoachNote.create({ ...data, coachId });
    }

    async listCoachNotes(coachId, query = {}) {
        const filter = { coachId };
        if (query.studentId) filter.studentId = query.studentId;
        return CoachNote.find(filter)
            .sort({ createdAt: -1 })
            .populate('studentId', 'name')
            .limit(50)
            .lean();
    }

    async listCoachStudents(coachId, query = {}) {
        const instructor = await Instructor.findOne({ userId: coachId, status: 'active' });
        if (!instructor) return [];

        const lessonStudentIds = await PracticalLesson.distinct('studentId', {
            coachId,
            schoolId: instructor.schoolId,
        });

        const enrollmentStudentIds = await Enrollment.distinct('userId', {
            schoolId: instructor.schoolId,
            status: { $in: LESSONABLE_STATUSES },
        });

        const allIds = [...new Set([...lessonStudentIds.map(String), ...enrollmentStudentIds.map(String)])];
        if (!allIds.length) return [];

        return User.find({ _id: { $in: allIds } })
            .select('name email phone')
            .lean();
    }
}

module.exports = new LessonService();
