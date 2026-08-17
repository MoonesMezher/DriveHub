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
const BUSINESS_HOUR_START = 9;
const BUSINESS_HOUR_END = 17;
const ACTIVE_LESSON_STATUS = 'scheduled';

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
        const baseFilter = { status: ACTIVE_LESSON_STATUS, scheduledAt: { $lt: end } };
        if (excludeId) baseFilter._id = { $ne: excludeId };

        const [coachLessons, studentLessons] = await Promise.all([
            PracticalLesson.find({ ...baseFilter, coachId }).lean(),
            PracticalLesson.find({ ...baseFilter, studentId }).lean(),
        ]);

        const hasConflict = [...coachLessons, ...studentLessons].some((l) => this._overlaps(l, start, end));
        if (hasConflict) throw new ApiError(409, ERR.LESSON_CONFLICT);
    }

    async _assertNoActiveBooking(studentId, excludeId = null) {
        const filter = { studentId, status: ACTIVE_LESSON_STATUS };
        if (excludeId) filter._id = { $ne: excludeId };
        const existing = await PracticalLesson.findOne(filter).lean();
        if (existing) throw new ApiError(409, ERR.LESSON_ACTIVE_EXISTS);
    }

    async _getLessonableEnrollment(studentId, enrollmentId) {
        const enrollment = await Enrollment.findOne({
            _id: enrollmentId,
            userId: studentId,
            status: { $in: LESSONABLE_STATUSES },
        });
        if (!enrollment) throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);
        return enrollment;
    }

    _parseRange(mode, dateInput) {
        const dateOnly = String(dateInput).slice(0, 10);
        const parts = dateOnly.split('-').map(Number);
        if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
            throw new ApiError(400, ERR.LESSON_INVALID_RANGE);
        }
        const [year, month, day] = parts;
        const from = new Date(year, month - 1, day, 0, 0, 0, 0);
        if (Number.isNaN(from.getTime())) throw new ApiError(400, ERR.LESSON_INVALID_RANGE);

        const to = new Date(from);
        if (mode === 'week') {
            to.setDate(to.getDate() + 7);
        } else {
            to.setDate(to.getDate() + 1);
        }

        if (to <= new Date()) {
            throw new ApiError(400, ERR.LESSON_RANGE_IN_PAST);
        }

        return { from, to };
    }

    _buildSlotsInRange(from, to) {
        const now = new Date();
        const slots = [];
        const cursor = new Date(from);
        while (cursor < to) {
            for (let hour = BUSINESS_HOUR_START; hour <= BUSINESS_HOUR_END; hour += 1) {
                const slot = new Date(cursor);
                slot.setHours(hour, 0, 0, 0);
                if (slot < from || slot >= to) continue;
                if (slot <= now) continue;
                slots.push(slot);
            }
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(0, 0, 0, 0);
        }
        return slots;
    }

    _mapCoach(coach) {
        return {
            _id: coach._id,
            userId: coach.userId?._id || coach.userId,
            name: coach.userId?.name || 'مدرب',
            gender: coach.gender,
            isFemaleCoach: coach.isFemaleCoach,
            licenseCategories: coach.licenseCategories,
        };
    }

    async book(studentId, { enrollmentId, coachId, scheduledAt, durationMinutes = FIXED_PRACTICAL_SESSION_MINUTES }) {
        const enrollment = await this._getLessonableEnrollment(studentId, enrollmentId);
        await this._assertNoActiveBooking(studentId);

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
            confirmed: false,
        });
    }

    async listEligibleCoaches(studentId, enrollmentId, options = {}) {
        const enrollment = await this._getLessonableEnrollment(studentId, enrollmentId);

        const filter = {
            schoolId: enrollment.schoolId,
            status: 'active',
            licenseCategories: enrollment.categoryCode,
        };

        const femaleOnly = options.femaleCoachOnly === true
            || options.femaleCoachOnly === 'true'
            || options.femaleCoachOnly === '1'
            || (options.femaleCoachOnly == null && enrollment.prefersFemaleCoach);
        if (femaleOnly) filter.isFemaleCoach = true;

        const instructors = await Instructor.find(filter)
            .populate('userId', 'name email')
            .lean();

        return instructors.map((coach) => this._mapCoach(coach));
    }

    async listAvailableCoaches(studentId, {
        enrollmentId,
        mode = 'day',
        date,
        femaleCoachOnly,
    }) {
        if (!['day', 'week'].includes(mode)) throw new ApiError(400, ERR.LESSON_INVALID_RANGE);
        if (!date) throw new ApiError(400, ERR.LESSON_INVALID_RANGE);

        const enrollment = await this._getLessonableEnrollment(studentId, enrollmentId);
        const { from, to } = this._parseRange(mode, date);
        const slots = this._buildSlotsInRange(from, to);
        if (!slots.length) {
            return {
                range: { mode, from, to },
                coaches: [],
                hasActiveBooking: Boolean(
                    await PracticalLesson.exists({ studentId, status: ACTIVE_LESSON_STATUS }),
                ),
            };
        }

        const coaches = await this.listEligibleCoaches(studentId, enrollmentId, { femaleCoachOnly });
        if (!coaches.length) {
            return {
                range: { mode, from, to },
                coaches: [],
                hasActiveBooking: Boolean(
                    await PracticalLesson.exists({ studentId, status: ACTIVE_LESSON_STATUS }),
                ),
            };
        }

        const coachUserIds = coaches.map((c) => c.userId);
        const [coachLessons, studentLessons, activeBooking] = await Promise.all([
            PracticalLesson.find({
                coachId: { $in: coachUserIds },
                status: ACTIVE_LESSON_STATUS,
                scheduledAt: { $gte: from, $lt: to },
            }).lean(),
            PracticalLesson.find({
                studentId,
                status: ACTIVE_LESSON_STATUS,
                scheduledAt: { $gte: from, $lt: to },
            }).lean(),
            PracticalLesson.findOne({ studentId, status: ACTIVE_LESSON_STATUS }).lean(),
        ]);

        const lessonsByCoach = coachLessons.reduce((acc, lesson) => {
            const key = String(lesson.coachId);
            acc[key] = acc[key] || [];
            acc[key].push(lesson);
            return acc;
        }, {});

        const available = coaches
            .map((coach) => {
                const busy = lessonsByCoach[String(coach.userId)] || [];
                const availableSlots = slots.filter((slot) => {
                    const slotEnd = new Date(slot.getTime() + FIXED_PRACTICAL_SESSION_MINUTES * 60 * 1000);
                    const coachBusy = busy.some((l) => this._overlaps(l, slot, slotEnd));
                    if (coachBusy) return false;
                    const studentBusy = studentLessons.some((l) => this._overlaps(l, slot, slotEnd));
                    return !studentBusy;
                }).map((slot) => slot.toISOString());

                return {
                    ...coach,
                    availableSlots,
                };
            })
            .filter((coach) => coach.availableSlots.length > 0);

        return {
            range: { mode, from, to },
            coaches: available,
            hasActiveBooking: Boolean(activeBooking),
            activeBookingId: activeBooking?._id || null,
        };
    }

    async autoBookNextLesson(studentId, {
        enrollmentId,
        durationMinutes = FIXED_PRACTICAL_SESSION_MINUTES,
        mode,
        date,
        femaleCoachOnly,
    }) {
        await this._assertNoActiveBooking(studentId);

        if (mode && date) {
            const availability = await this.listAvailableCoaches(studentId, {
                enrollmentId,
                mode,
                date,
                femaleCoachOnly,
            });
            if (!availability.coaches.length) throw new ApiError(409, ERR.LESSON_NO_SLOTS);

            const firstCoach = availability.coaches[0];
            const firstSlot = firstCoach.availableSlots[0];
            return this.book(studentId, {
                enrollmentId,
                coachId: firstCoach.userId,
                scheduledAt: firstSlot,
                durationMinutes: FIXED_PRACTICAL_SESSION_MINUTES,
            });
        }

        const enrollment = await this._getLessonableEnrollment(studentId, enrollmentId);
        const coaches = await this.listEligibleCoaches(studentId, enrollmentId, { femaleCoachOnly });
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
                status: ACTIVE_LESSON_STATUS,
                scheduledAt: { $gte: base, $lt: rangeEnd },
            }).lean(),
            PracticalLesson.find({
                studentId,
                status: ACTIVE_LESSON_STATUS,
                scheduledAt: { $gte: base, $lt: rangeEnd },
            }).lean(),
            PracticalLesson.aggregate([
                { $match: { studentId, enrollmentId: enrollment._id, status: 'completed' } },
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
            for (let hour = BUSINESS_HOUR_START; hour <= BUSINESS_HOUR_END; hour += 1) {
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

    async cancelByStudent(studentId, lessonId) {
        const lesson = await PracticalLesson.findOne({ _id: lessonId, studentId });
        if (!lesson) throw new ApiError(404, ERR.LESSON_NOT_FOUND);
        if (lesson.status !== ACTIVE_LESSON_STATUS) {
            throw new ApiError(400, ERR.LESSON_NOT_CANCELLABLE);
        }
        lesson.status = 'cancelled';
        lesson.confirmed = false;
        await lesson.save();
        return lesson;
    }

    async cancelByCoach(coachId, lessonId) {
        const lesson = await PracticalLesson.findOne({ _id: lessonId, coachId });
        if (!lesson) throw new ApiError(404, ERR.LESSON_NOT_FOUND);
        if (lesson.status !== ACTIVE_LESSON_STATUS) {
            throw new ApiError(400, ERR.LESSON_NOT_CANCELLABLE);
        }
        lesson.status = 'cancelled';
        lesson.confirmed = false;
        await lesson.save();
        return lesson;
    }

    async postponeByCoach(coachId, lessonId, { scheduledAt }) {
        const lesson = await PracticalLesson.findOne({ _id: lessonId, coachId });
        if (!lesson) throw new ApiError(404, ERR.LESSON_NOT_FOUND);
        if (lesson.status !== ACTIVE_LESSON_STATUS) {
            throw new ApiError(400, ERR.LESSON_NOT_POSTPONABLE);
        }

        const nextAt = new Date(scheduledAt);
        if (Number.isNaN(nextAt.getTime()) || nextAt <= new Date()) {
            throw new ApiError(400, ERR.LESSON_INVALID_SCHEDULE);
        }

        await this._checkConflict({
            coachId,
            studentId: lesson.studentId,
            scheduledAt: nextAt,
            durationMinutes: lesson.durationMinutes || FIXED_PRACTICAL_SESSION_MINUTES,
            excludeId: lesson._id,
        });

        lesson.scheduledAt = nextAt;
        lesson.confirmed = false;
        await lesson.save();
        return lesson;
    }

    async confirmByCoach(coachId, lessonId) {
        const lesson = await PracticalLesson.findOne({ _id: lessonId, coachId });
        if (!lesson) throw new ApiError(404, ERR.LESSON_NOT_FOUND);
        if (lesson.status !== ACTIVE_LESSON_STATUS) {
            throw new ApiError(400, ERR.LESSON_NOT_CONFIRMABLE);
        }
        lesson.confirmed = true;
        await lesson.save();
        return lesson;
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

        if (lesson.scheduledAt && new Date(lesson.scheduledAt).getTime() > Date.now()) {
            throw new ApiError(400, ERR.LESSON_FUTURE_COMPLETE);
        }

        lesson.status = status;
        if (rating) lesson.rating = rating;
        if (coachNotes) lesson.coachNotes = coachNotes;
        if (status !== ACTIVE_LESSON_STATUS) lesson.confirmed = false;
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

    async _assertCoachOwnsStudent(coachId, studentId, schoolId) {
        await this._assertCoachInSchool(coachId, schoolId);
        const hasLesson = await PracticalLesson.exists({
            coachId,
            studentId,
            schoolId,
        });
        if (!hasLesson) {
            throw new ApiError(403, ERR.COACH_STUDENT_NOT_ASSIGNED);
        }
    }

    async addCoachNote(coachId, data) {
        await this._assertCoachOwnsStudent(coachId, data.studentId, data.schoolId);
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

    async listCoachStudents(coachId) {
        const instructor = await Instructor.findOne({ userId: coachId, status: 'active' });
        if (!instructor) return [];

        const lessonStudentIds = await PracticalLesson.distinct('studentId', {
            coachId,
            schoolId: instructor.schoolId,
        });
        if (!lessonStudentIds.length) return [];

        return User.find({ _id: { $in: lessonStudentIds } })
            .select('name email phone')
            .lean();
    }
}

module.exports = new LessonService();
