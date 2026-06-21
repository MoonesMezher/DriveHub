const crypto = require('crypto');
const { StudentRoster, Enrollment, TrainingCourse, DrivingSchool } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { sendInstant } = require('../helpers/notificationDelivery.helper');

const ROSTER_ELIGIBLE = [
    ENROLLMENT_STATUS.ACTIVE,
    ENROLLMENT_STATUS.COMPLETED,
    ENROLLMENT_STATUS.EXAM_PENDING,
    ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
    ENROLLMENT_STATUS.FINAL_PASSED,
];

class RosterService {
    async create({ courseId, schoolId, studentIds, enrollmentIds = [], submittedBy }) {
        const existing = await StudentRoster.findOne({ courseId });
        if (existing) throw new ApiError(409, ERR.ROSTER_EXISTS);

        const course = await TrainingCourse.findOne({ _id: courseId, schoolId });
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        const enrollments = await Enrollment.find({
            courseId,
            schoolId,
            userId: { $in: studentIds },
            status: { $in: ROSTER_ELIGIBLE },
        });

        if (enrollments.length !== studentIds.length) {
            throw new ApiError(400, 'بعض الطلاب غير مؤهلين للقائمة أو لا ينتمون للدورة');
        }

        const resolvedEnrollmentIds = enrollmentIds.length
            ? enrollmentIds
            : enrollments.map((e) => e._id);

        return StudentRoster.create({
            schoolId,
            courseId,
            studentIds,
            enrollmentIds: resolvedEnrollmentIds,
            submittedBy,
            status: 'draft',
        });
    }

    async getByCourse(courseId, schoolId = null) {
        const filter = { courseId };
        if (schoolId) filter.schoolId = schoolId;
        const roster = await StudentRoster.findOne(filter)
            .populate('studentIds', 'name email')
            .populate('submittedBy', 'name')
            .lean();
        if (!roster) throw new ApiError(404, ERR.ROSTER_NOT_FOUND);
        return roster;
    }

    async submit(rosterId, submittedBy) {
        const roster = await StudentRoster.findById(rosterId);
        if (!roster) throw new ApiError(404, ERR.ROSTER_NOT_FOUND);
        if (roster.status !== 'draft') throw new ApiError(400, ERR.ROSTER_ALREADY_SUBMITTED);

        const [course, school] = await Promise.all([
            TrainingCourse.findById(roster.courseId).lean(),
            DrivingSchool.findById(roster.schoolId).select('name governorate').lean(),
        ]);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const submittedAt = new Date();
        const qrPayload = {
            rosterId: String(roster._id),
            schoolId: String(roster.schoolId),
            schoolName: school?.name || null,
            governorate: school?.governorate || null,
            courseId: String(roster.courseId),
            categoryCode: course?.categoryCode || null,
            subTypeCode: course?.subTypeCode || null,
            studentCount: roster.studentIds.length,
            submittedAt: submittedAt.toISOString(),
            issuedBy: 'DriveHub',
        };

        roster.status = 'submitted';
        roster.submittedAt = submittedAt;
        roster.submittedBy = submittedBy;
        roster.verificationToken = verificationToken;
        roster.qrPayload = qrPayload;
        roster.qrCode = verificationToken.slice(0, 16);
        await roster.save();

        for (const studentId of roster.studentIds) {
            await sendInstant(studentId, {
                type: NOTIFICATION_TYPES.ROSTER_SUBMITTED,
                title: 'تم إرسال قائمة الطلاب للمرور',
                message: 'تم تضمينك في قائمة الطلاب المرسلة لإدارة المرور.',
                data: { rosterId: roster._id },
            });
        }

        return roster;
    }

    async distribute(rosterId, { trafficBatchId = null } = {}) {
        const roster = await StudentRoster.findById(rosterId);
        if (!roster) throw new ApiError(404, ERR.ROSTER_NOT_FOUND);
        if (roster.status !== 'submitted') throw new ApiError(400, ERR.ROSTER_NOT_SUBMITTED);

        roster.status = 'distributed';
        roster.trafficBatchId = trafficBatchId || `BATCH-${Date.now()}`;
        await roster.save();

        const enrollments = await Enrollment.updateMany(
            { _id: { $in: roster.enrollmentIds } },
            { status: ENROLLMENT_STATUS.EXAM_PENDING },
        );

        return { roster, updatedEnrollments: enrollments.modifiedCount };
    }

    async listPending() {
        return StudentRoster.find({ status: 'submitted' })
            .populate('schoolId', 'name governorate')
            .populate('courseId', 'categoryCode launchDate')
            .sort({ submittedAt: -1 })
            .lean();
    }

    async listBySchool(schoolId, { status } = {}) {
        const filter = { schoolId };
        if (status) filter.status = status;
        return StudentRoster.find(filter)
            .populate('courseId', 'categoryCode subTypeCode')
            .sort({ updatedAt: -1 })
            .lean();
    }

    async verifyByToken(token, auditMeta = {}) {
        const roster = await StudentRoster.findOne({ verificationToken: token })
            .populate('schoolId', 'name governorate')
            .populate('courseId', 'categoryCode subTypeCode launchDate')
            .populate('submittedBy', 'name')
            .lean();
        if (!roster || roster.status === 'draft') {
            throw new ApiError(404, ERR.ROSTER_VERIFY_NOT_FOUND);
        }

        const auditService = require('./audit.service');
        await auditService.log({
            action: 'roster.verify',
            entityType: 'StudentRoster',
            entityId: roster._id,
            metadata: {
                token: token.slice(0, 8),
                ip: auditMeta.ip || null,
                userAgent: auditMeta.userAgent || null,
            },
        });

        return {
            valid: true,
            rosterId: roster._id,
            status: roster.status,
            submittedAt: roster.submittedAt,
            studentCount: roster.studentIds?.length ?? 0,
            trafficBatchId: roster.trafficBatchId,
            qrPayload: roster.qrPayload,
            school: roster.schoolId,
            course: roster.courseId,
            submittedBy: roster.submittedBy,
        };
    }
}

module.exports = new RosterService();
