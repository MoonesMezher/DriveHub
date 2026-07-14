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
const FIXED_PRACTICAL_SESSION_MINUTES = 60;

class LessonService {
    async _resolveCoach(coachId, schoolId) {
        let instructor = await Instructor.findOne({ userId: coachId, schoolId, status: 'active' });
        if (!instructor) {
            instructor = await Instructor.findOne({ _id: coachId, schoolId, status: 'active' });
        }
        if (!instructor) throw new ApiError(400, ERR.COACH_NOT_IN_SCHOOL);
        return { instructor, coachUserId: instructor.userId };
    }

    async _assertCoachInSchool(coachId, schoolId) {
        const { instructor } = await this._resolveCoach(coachId, schoolId);
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

    async book(studentId, { enrollmentId, coachId, scheduledAt, durationMinutes = FIXED_PRACTICAL_SESSION_MINUTES }) {
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            userId: studentId,
            status: { $in: LESSONABLE_STATUSES },
        });
        if (!enrollment) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);

        const { coachUserId } = await this._resolveCoach(coachId, enrollment.schoolId);
        await this._checkConflict({
            coachId: coachUserId,
            studentId,
            scheduledAt,
            durationMinutes: FIXED_PRACTICAL_SESSION_MINUTES,
        });

        return PracticalLesson.create({
            enrollmentId,
            studentId,
            coachId: coachUserId,
            schoolId: enrollment.schoolId,
            scheduledAt,
            durationMinutes: FIXED_PRACTICAL_SESSION_MINUTES,
        });
    }

    async listEligibleCoaches(studentId, enrollmentId) {
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            userId: studentId,
            status: { $in: LESSONABLE_STATUSES },
        });
        if (!enrollment) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);

        const filter = {
            schoolId: enrollment.schoolId,
            status: 'active',
            licenseCategories: enrollment.categoryCode,
        };
        if (enrollment.prefersFemaleCoach) filter.isFemaleCoach = true;

        const instructors = await Instructor.find(filter)
            .populate('userId', 'name email')
            .lean();

        return instructors.map((coach) => ({
            _id: coach._id,
            userId: coach.userId?._id || coach.userId,
            name: coach.userId?.name || 'مدرب',
            gender: coach.gender,
            isFemaleCoach: coach.isFemaleCoach,
            licenseCategories: coach.licenseCategories,
        }));
    }

    async autoBookNextLesson(studentId, { enrollmentId, durationMinutes = FIXED_PRACTICAL_SESSION_MINUTES }) {
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            userId: studentId,
            status: { $in: LESSONABLE_STATUSES },
        });
        if (!enrollment) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);

        const coaches = await this.listEligibleCoaches(studentId, enrollmentId);
        if (!coaches.length) throw new ApiError(400, ERR.LESSON_NO_COACHES);

        const coachUserIds = coaches.map((c) => c.userId);
        const base = new Date();
        base.setDate(base.getDate() + 1);
        base.setHours(9, 0, 0, 0);

        const rangeEnd = new Date(base);
        rangeEnd.setDate(rangeEnd.getDate() + 14);

        const [coachLessons, studentLessons, pastCoachCounts] = await Promise.all([
            PracticalLesson.find({
                coachId: { $in: coachUserIds },
                status: 'scheduled',
                scheduledAt: { $gte: base, $lt: rangeEnd },
            }).lean(),
            PracticalLesson.find({
                studentId,
                status: 'scheduled',
                scheduledAt: { $gte: base, $lt: rangeEnd },
            }).lean(),
            PracticalLesson.aggregate([
                { $match: { studentId, enrollmentId, status: 'completed' } },
                { $group: { _id: '$coachId', count: { $sum: 1 } } },
            ]),
        ]);

        const pastCoachMap = new Map(pastCoachCounts.map((row) => [String(row._id), row.count]));
        const workloadMap = coachLessons.reduce((acc, lesson) => {
            const key = String(lesson.coachId);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const sortedCoaches = [...coaches].sort((a, b) => {
            const pastA = pastCoachMap.get(String(a.userId)) || 0;
            const pastB = pastCoachMap.get(String(b.userId)) || 0;
            if (pastB !== pastA) return pastB - pastA;
            const loadA = workloadMap[String(a.userId)] || 0;
            const loadB = workloadMap[String(b.userId)] || 0;
            return loadA - loadB;
        });

        const lessonsByCoach = coachLessons.reduce((acc, lesson) => {
            const key = String(lesson.coachId);
            acc[key] = acc[key] || [];
            acc[key].push(lesson);
            return acc;
        }, {});

        for (let day = 0; day < 14; day += 1) {
            for (let hour = 9; hour <= 17; hour += 1) {
                const slot = new Date(base);
                slot.setDate(base.getDate() + day);
                slot.setHours(hour, 0, 0, 0);
                if (slot <= new Date()) continue;

                const slotEnd = new Date(
                    slot.getTime() + FIXED_PRACTICAL_SESSION_MINUTES * 60 * 1000,
                );
                const studentBusy = studentLessons.some((l) => this._overlaps(l, slot, slotEnd));
                if (studentBusy) continue;

                for (const coach of sortedCoaches) {
                    const coachBusy = (lessonsByCoach[String(coach.userId)] || [])
                        .some((l) => this._overlaps(l, slot, slotEnd));
                    if (coachBusy) continue;

                    return this.book(studentId, {
                        enrollmentId,
                        coachId: coach.userId,
                        scheduledAt: slot,
                        durationMinutes: FIXED_PRACTICAL_SESSION_MINUTES,
                    });
                }
            }
        }

        throw new ApiError(409, ERR.LESSON_NO_SLOTS);
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

    async listSchoolSchedule(schoolId, query = {}) {
        const filter = { schoolId };
        if (query.status) filter.status = query.status;
        if (query.from) filter.scheduledAt = { $gte: new Date(query.from) };
        if (query.to) {
            filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(query.to) };
        }
        return PracticalLesson.find(filter)
            .sort({ scheduledAt: 1 })
            .populate('studentId', 'name email')
            .populate('coachId', 'name')
            .populate('enrollmentId', 'categoryCode subTypeCode')
            .limit(200)
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
