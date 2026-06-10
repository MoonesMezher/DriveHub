const { Enrollment, TrainingCourse, DrivingSchool, WaitingList } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { paymentDeadlineFromNow } = require('../utils/dateUtils');
const enrollmentHelper = require('../helpers/enrollment.helper');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

const CANCELLABLE = new Set([
    ENROLLMENT_STATUS.SUBMITTED,
    ENROLLMENT_STATUS.UNDER_REVIEW,
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.AWAITING_PAYMENT,
]);

class EnrollmentService {
    async assertNoPending(userId) {
        const pending = await Enrollment.findOne({
            userId,
            status: { $in: [...enrollmentHelper.PENDING_STATUSES] },
        });
        if (pending) {
            throw new ApiError(409, ERR.ENROLLMENT_PENDING_EXISTS);
        }
    }

    async applyManagerQueueVisibility(courseId, enrollment) {
        const course = await TrainingCourse.findById(courseId);
        if (!course) return enrollment;

        const spots = enrollmentHelper.getAvailableSpots(course);
        const visibleCount = await Enrollment.countDocuments({
            courseId,
            managerVisible: true,
            status: { $in: [ENROLLMENT_STATUS.SUBMITTED, ENROLLMENT_STATUS.UNDER_REVIEW] },
        });

        if (visibleCount >= spots) {
            enrollment.managerVisible = false;
            await enrollment.save();
            await WaitingList.findOneAndUpdate(
                { courseId, userId: enrollment.userId },
                {
                    courseId,
                    userId: enrollment.userId,
                    enrollmentId: enrollment._id,
                    categoryCode: enrollment.categoryCode,
                    subTypeCode: enrollment.subTypeCode,
                    status: 'waiting',
                    position: visibleCount + 1,
                },
                { upsert: true, new: true },
            );
        }

        return enrollment;
    }

    async create({ userId, courseId, schoolId, categoryCode, subTypeCode, prefersFemaleCoach }) {
        await this.assertNoPending(userId);

        const school = await DrivingSchool.findById(schoolId);
        if (!school || school.status !== 'active' || school.registrationPaused) {
            throw new ApiError(400, ERR.SCHOOL_NOT_FOUND);
        }

        const course = await TrainingCourse.findOne({
            _id: courseId,
            schoolId,
            registrationOpen: true,
        });
        if (!course) {
            throw new ApiError(404, ERR.COURSE_NOT_FOUND);
        }

        if (!enrollmentHelper.getAvailableSpots(course)) {
            throw new ApiError(400, ERR.ENROLLMENT_NO_SPOTS);
        }

        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            prefersFemaleCoach,
            status: ENROLLMENT_STATUS.SUBMITTED,
            managerVisible: true,
        });

        return this.applyManagerQueueVisibility(courseId, enrollment);
    }

    async listMine(userId) {
        return Enrollment.find({ userId })
            .sort({ createdAt: -1 })
            .populate('schoolId', 'name address governorate')
            .populate('courseId', 'categoryCode subTypeCode status launchDate')
            .lean();
    }

    async getById(id, userId = null) {
        const filter = { _id: id };
        if (userId) filter.userId = userId;
        const enrollment = await Enrollment.findOne(filter)
            .populate('schoolId', 'name')
            .populate('courseId', 'categoryCode status');
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);
        return enrollment;
    }

    async cancel(enrollmentId, userId) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);
        if (!CANCELLABLE.has(enrollment.status)) {
            throw new ApiError(400, ERR.ENROLLMENT_NOT_CANCELLABLE);
        }

        enrollment.status = ENROLLMENT_STATUS.CANCELLED;
        enrollment.cancelledAt = new Date();
        await enrollment.save();

        await WaitingList.updateOne(
            { enrollmentId: enrollment._id },
            { status: 'expired' },
        );

        return enrollment;
    }

    async getManagerQueue(courseId) {
        const course = await TrainingCourse.findById(courseId);
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        const spots = enrollmentHelper.getAvailableSpots(course);
        const requests = await Enrollment.find({
            courseId,
            managerVisible: true,
            status: ENROLLMENT_STATUS.SUBMITTED,
        }).sort({ createdAt: 1 });

        return enrollmentHelper.filterRequestsForManager(requests, spots);
    }

    async accept(enrollmentId, paymentDeadlineDays = 3) {
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        enrollment.status = ENROLLMENT_STATUS.AWAITING_PAYMENT;
        enrollment.paymentDeadline = paymentDeadlineFromNow(paymentDeadlineDays);
        await enrollment.save();

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: enrollment.userId,
            type: NOTIFICATION_TYPES.ENROLLMENT_ACCEPTED,
            title: 'تم قبول طلبك',
            message: `تم قبول طلب الاشتراك. أكمل الدفع خلال ${paymentDeadlineDays} أيام.`,
            data: { enrollmentId: enrollment._id },
        });

        return enrollment;
    }

    async reject(enrollmentId, rejectionReason = null) {
        const enrollment = await Enrollment.findByIdAndUpdate(
            enrollmentId,
            { status: ENROLLMENT_STATUS.REJECTED },
            { new: true },
        );
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: enrollment.userId,
            type: NOTIFICATION_TYPES.ENROLLMENT_REJECTED,
            title: 'تم رفض طلبك',
            message: rejectionReason || 'لم يتم قبول طلب الاشتراك.',
            data: { enrollmentId: enrollment._id },
        });

        return enrollment;
    }

    async expireAwaitingPayment() {
        const now = new Date();
        const expired = await Enrollment.find({
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: { $lt: now },
        });

        const notificationService = require('./notification.service');

        for (const enrollment of expired) {
            enrollment.status = ENROLLMENT_STATUS.EXPIRED;
            await enrollment.save();

            await notificationService.send({
                userId: enrollment.userId,
                type: NOTIFICATION_TYPES.PAYMENT_EXPIRED,
                title: 'انتهت مهلة الدفع',
                message: 'انتهت مهلة الدفع وتم إلغاء حجزك. يمكنك التقديم مجدداً.',
                data: { enrollmentId: enrollment._id },
            });

            await this.promoteNextFromWaitlist(enrollment.courseId);
        }

        return expired.length;
    }

    async promoteNextFromWaitlist(courseId) {
        const next = await WaitingList.findOne({ courseId, status: 'waiting' }).sort({ position: 1 });
        if (!next) return null;

        const enrollment = await Enrollment.findById(next.enrollmentId);
        if (!enrollment || enrollment.status !== ENROLLMENT_STATUS.SUBMITTED) {
            next.status = 'expired';
            await next.save();
            return null;
        }

        enrollment.managerVisible = true;
        await enrollment.save();
        next.status = 'promoted';
        next.promotedAt = new Date();
        await next.save();

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: next.userId,
            type: NOTIFICATION_TYPES.WAITLIST_PROMOTED,
            title: 'تمت ترقيتك من قائمة الانتظار',
            message: 'أصبح طلبك مرئياً لمدير المدرسة.',
            data: { enrollmentId: enrollment._id },
        });

        return enrollment;
    }
}

module.exports = new EnrollmentService();
