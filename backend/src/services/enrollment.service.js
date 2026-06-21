const {
    Enrollment,
    EnrollmentArchive,
    TrainingCourse,
    DrivingSchool,
    WaitingList,
    LicenseCategory,
    DrivingLicenseRecord,
    FinalExamResult,
    StudentStatistics,
    User,
} = require('../models');
const dayjs = require('dayjs');
const { ENROLLMENT_STATUS, RETAKE_SCOPE } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { paymentDeadlineFromNow } = require('../utils/dateUtils');
const enrollmentHelper = require('../helpers/enrollment.helper');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { sendInstant } = require('../helpers/notificationDelivery.helper');
const { buildAlternateSchoolSuggestions } = require('../helpers/enrollmentSuggestions.helper');

const CANCELLABLE = new Set([
    ENROLLMENT_STATUS.SUBMITTED,
    ENROLLMENT_STATUS.UNDER_REVIEW,
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.AWAITING_PAYMENT,
]);

const RETAKABLE_STATUSES = new Set([
    ENROLLMENT_STATUS.FINAL_FAILED_THEORY,
    ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
]);

class EnrollmentService {
    async deriveRetakeScope(enrollmentOrId, latestResult = null) {
        const enrollment = typeof enrollmentOrId === 'object' && enrollmentOrId?._id
            ? enrollmentOrId
            : await Enrollment.findById(enrollmentOrId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        if (enrollment.status === ENROLLMENT_STATUS.FINAL_FAILED_THEORY) {
            return RETAKE_SCOPE.FULL;
        }

        if (enrollment.status === ENROLLMENT_STATUS.FINAL_THEORY_PASSED) {
            let practicalFailCount = await FinalExamResult.countDocuments({
                enrollmentId: enrollment._id,
                theoryPassed: true,
                practicalPassed: false,
            });
            if (
                latestResult
                && latestResult.theoryPassed
                && latestResult.practicalPassed === false
                && String(latestResult.enrollmentId) === String(enrollment._id)
            ) {
                practicalFailCount = Math.max(practicalFailCount, 1);
            }
            return practicalFailCount >= 2 ? RETAKE_SCOPE.FULL : RETAKE_SCOPE.PRACTICAL_ONLY;
        }

        throw new ApiError(400, ERR.ENROLLMENT_NOT_RETAKEABLE);
    }

    async archiveEnrollment(enrollment, reason = 'retake') {
        if (enrollment.archiveRef) {
            throw new ApiError(400, ERR.ENROLLMENT_ALREADY_ARCHIVED);
        }

        const [statistics, finalResult] = await Promise.all([
            StudentStatistics.findOne({ enrollmentId: enrollment._id }).lean(),
            FinalExamResult.findOne({ enrollmentId: enrollment._id }).sort({ createdAt: -1 }).lean(),
        ]);

        const archive = await EnrollmentArchive.create({
            userId: enrollment.userId,
            enrollmentId: enrollment._id,
            schoolId: enrollment.schoolId,
            categoryCode: enrollment.categoryCode,
            subTypeCode: enrollment.subTypeCode,
            reason,
            preservedData: {
                status: enrollment.status,
                retakeAttempt: enrollment.retakeAttempt,
                retakeScope: enrollment.retakeScope,
                finalResult,
                statistics,
                paidAt: enrollment.paidAt,
            },
        });

        enrollment.archiveRef = archive._id;
        await enrollment.save();

        return archive;
    }

    async createRetake({ userId, priorEnrollmentId, retakeScope, paymentDeadlineDays = 3 }) {
        await this.assertNoPending(userId);

        const prior = await Enrollment.findOne({ _id: priorEnrollmentId, userId });
        if (!prior) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);
        if (!RETAKABLE_STATUSES.has(prior.status)) {
            throw new ApiError(400, ERR.ENROLLMENT_NOT_RETAKEABLE);
        }

        const latestResult = await FinalExamResult.findOne({ enrollmentId: prior._id })
            .sort({ createdAt: -1 })
            .lean();
        const derivedScope = await this.deriveRetakeScope(prior, latestResult);
        if (retakeScope && retakeScope !== derivedScope) {
            throw new ApiError(400, ERR.ENROLLMENT_RETAKE_SCOPE_MISMATCH);
        }
        const scope = retakeScope || derivedScope;

        let targetCourse = await TrainingCourse.findById(prior.courseId);
        if (!targetCourse?.registrationOpen) {
            targetCourse = await TrainingCourse.findOne({
                schoolId: prior.schoolId,
                categoryCode: prior.categoryCode,
                subTypeCode: prior.subTypeCode || null,
                registrationOpen: true,
            });
        }
        if (!targetCourse) {
            throw new ApiError(400, ERR.ENROLLMENT_RETAKE_COURSE_UNAVAILABLE);
        }

        await this.archiveEnrollment(prior, 'retake');

        const nextAttempt = (prior.retakeAttempt || 0) + 1;
        const enrollment = await Enrollment.create({
            userId,
            courseId: targetCourse._id,
            schoolId: prior.schoolId,
            categoryCode: prior.categoryCode,
            subTypeCode: prior.subTypeCode,
            retakeAttempt: nextAttempt,
            retakeScope: scope,
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: paymentDeadlineFromNow(paymentDeadlineDays),
            managerVisible: true,
            prefersFemaleCoach: prior.prefersFemaleCoach,
        });

        await sendInstant(userId, {
            type: NOTIFICATION_TYPES.GENERAL,
            title: 'طلب إعادة اشتراك',
            message: `تم إنشاء طلب إعادة اشتراك (${scope === RETAKE_SCOPE.FULL ? 'شقين' : 'عملي فقط'}). أكمل الدفع خلال ${paymentDeadlineDays} أيام.`,
            data: { enrollmentId: enrollment._id, priorEnrollmentId: prior._id, retakeScope: scope },
        });

        return enrollment;
    }

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

    async assertPlatformRegistrationOpen() {
        const settingsService = require('./settings.service');
        const paused = await settingsService.isRegistrationPaused();
        if (paused) throw new ApiError(400, ERR.PLATFORM_REGISTRATION_PAUSED);
    }

    async assertMinAge(userId, categoryCode) {
        const [user, license] = await Promise.all([
            User.findById(userId).select('profileData').lean(),
            LicenseCategory.findOne({ code: categoryCode.toUpperCase() }).lean(),
        ]);
        if (!license) throw new ApiError(404, ERR.LICENSE_NOT_FOUND);

        const dob = user?.profileData?.dateOfBirth;
        if (!dob) throw new ApiError(400, ERR.ENROLLMENT_DOB_REQUIRED);

        const age = dayjs().diff(dayjs(dob), 'year');
        if (age < license.minAge) {
            throw new ApiError(400, ERR.ENROLLMENT_UNDERAGE, { minAge: license.minAge, age });
        }
    }

    async assertPrerequisites(userId, categoryCode) {
        const license = await LicenseCategory.findOne({ code: categoryCode.toUpperCase() });
        if (!license?.prerequisites?.length) return;

        for (const prereq of license.prerequisites) {
            const code = prereq.toUpperCase();
            const hasRecord = await DrivingLicenseRecord.findOne({ userId, categoryCode: code });
            const hasPassed = await Enrollment.findOne({
                userId,
                categoryCode: code,
                status: ENROLLMENT_STATUS.FINAL_PASSED,
            });
            if (!hasRecord && !hasPassed) {
                throw new ApiError(400, ERR.ENROLLMENT_PREREQUISITE_MISSING);
            }
        }
    }

    async assertCategoryNotActive(userId, categoryCode, subTypeCode = null) {
        const active = await Enrollment.findOne({
            userId,
            categoryCode: categoryCode.toUpperCase(),
            status: { $in: enrollmentHelper.ACTIVE_STUDENT_STATUSES },
        });
        if (!active) return;

        if (subTypeCode && active.subTypeCode && active.subTypeCode !== subTypeCode.toUpperCase()) {
            throw new ApiError(409, ERR.ENROLLMENT_ACTIVE_CATEGORY_EXISTS);
        }
        if (!subTypeCode || active.subTypeCode === subTypeCode?.toUpperCase()) {
            throw new ApiError(409, ERR.ENROLLMENT_ACTIVE_CATEGORY_EXISTS);
        }
    }

    async create({ userId, courseId, schoolId, categoryCode, subTypeCode, prefersFemaleCoach }) {
        await this.assertNoPending(userId);
        await this.assertPlatformRegistrationOpen();

        const normalizedCategory = categoryCode.toUpperCase();
        const normalizedSubType = subTypeCode?.toUpperCase() || null;

        const school = await DrivingSchool.findById(schoolId);
        if (!school || school.status !== 'active' || school.registrationPaused) {
            throw new ApiError(400, ERR.SCHOOL_NOT_FOUND);
        }

        await this.assertMinAge(userId, normalizedCategory);

        const course = await TrainingCourse.findOne({
            _id: courseId,
            schoolId,
            registrationOpen: true,
        });
        if (!course) {
            throw new ApiError(404, ERR.COURSE_NOT_FOUND);
        }

        if (course.categoryCode !== normalizedCategory) {
            throw new ApiError(400, ERR.ENROLLMENT_CATEGORY_MISMATCH);
        }

        if (course.subTypeCode && normalizedSubType && course.subTypeCode !== normalizedSubType) {
            throw new ApiError(400, ERR.ENROLLMENT_CATEGORY_MISMATCH);
        }

        if (normalizedCategory === 'B' && !normalizedSubType && !course.subTypeCode) {
            throw new ApiError(400, ERR.ENROLLMENT_SUBTYPE_REQUIRED);
        }

        const resolvedSubType = normalizedSubType || course.subTypeCode || null;

        await this.assertPrerequisites(userId, normalizedCategory);
        await this.assertCategoryNotActive(userId, normalizedCategory, resolvedSubType);

        if (!enrollmentHelper.getAvailableSpots(course)) {
            const suggestions = await buildAlternateSchoolSuggestions({
                categoryCode: normalizedCategory,
                subTypeCode: resolvedSubType,
                governorate: school.governorate,
                excludeSchoolId: schoolId,
                lat: school.lat,
                lng: school.lng,
            });
            throw new ApiError(400, ERR.ENROLLMENT_NO_SPOTS, { suggestions });
        }

        const enrollment = await Enrollment.create({
            userId,
            courseId,
            schoolId,
            categoryCode: normalizedCategory,
            subTypeCode: resolvedSubType,
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

    async listRosterCandidates(courseId, schoolId) {
        const course = await TrainingCourse.findOne({ _id: courseId, schoolId });
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        const ROSTER_ELIGIBLE = [
            ENROLLMENT_STATUS.ACTIVE,
            ENROLLMENT_STATUS.COMPLETED,
            ENROLLMENT_STATUS.EXAM_PENDING,
            ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
            ENROLLMENT_STATUS.FINAL_PASSED,
        ];

        return Enrollment.find({
            courseId,
            schoolId,
            status: { $in: ROSTER_ELIGIBLE },
        })
            .populate('userId', 'name email phone')
            .sort({ createdAt: 1 })
            .lean();
    }

    async accept(enrollmentId, paymentDeadlineDays = 3) {
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        enrollment.status = ENROLLMENT_STATUS.AWAITING_PAYMENT;
        enrollment.paymentDeadline = paymentDeadlineFromNow(paymentDeadlineDays);
        await enrollment.save();

        await sendInstant(enrollment.userId, {
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

        const school = await DrivingSchool.findById(enrollment.schoolId).select('governorate lat lng').lean();
        const suggestions = await buildAlternateSchoolSuggestions({
            categoryCode: enrollment.categoryCode,
            subTypeCode: enrollment.subTypeCode,
            governorate: school?.governorate,
            excludeSchoolId: enrollment.schoolId,
            lat: school?.lat,
            lng: school?.lng,
        });

        await sendInstant(enrollment.userId, {
            type: NOTIFICATION_TYPES.ENROLLMENT_REJECTED,
            title: 'تم رفض طلبك',
            message: rejectionReason || 'لم يتم قبول طلب الاشتراك.',
            data: { enrollmentId: enrollment._id },
            suggestions,
        });

        return enrollment;
    }

    async expireAwaitingPayment() {
        const now = new Date();
        const expired = await Enrollment.find({
            status: ENROLLMENT_STATUS.AWAITING_PAYMENT,
            paymentDeadline: { $lt: now },
        });

        for (const enrollment of expired) {
            enrollment.status = ENROLLMENT_STATUS.EXPIRED;
            await enrollment.save();

            await sendInstant(enrollment.userId, {
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

        await sendInstant(next.userId, {
            type: NOTIFICATION_TYPES.WAITLIST_PROMOTED,
            title: 'تمت ترقيتك من قائمة الانتظار',
            message: 'أصبح طلبك مرئياً لمدير المدرسة.',
            data: { enrollmentId: enrollment._id },
        });

        return enrollment;
    }
}

module.exports = new EnrollmentService();
