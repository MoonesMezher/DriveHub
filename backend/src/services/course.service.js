const {
    TrainingCourse,
    Enrollment,
    DrivingSchool,
    WaitingList,
    PlatformPricing,
    Instructor,
} = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const courseHelper = require('../helpers/course.helper');
const { computeMaxStudents } = require('../constants/courseCapacity');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { sendInstant } = require('../helpers/notificationDelivery.helper');

class CourseService {
    async _assertFifteenDayGap(schoolId, excludeCourseId = null) {
        const filter = {
            schoolId,
            launchDate: { $ne: null },
        };
        if (excludeCourseId) filter._id = { $ne: excludeCourseId };

        const lastLaunched = await TrainingCourse.findOne(filter)
            .sort({ launchDate: -1 })
            .select('launchDate')
            .lean();

        if (lastLaunched?.launchDate && !courseHelper.canLaunchNewCourse(lastLaunched.launchDate)) {
            throw new ApiError(400, ERR.COURSE_CREATE_TOO_EARLY);
        }
    }

    async create({ schoolId, categoryCode, subTypeCode, maxStudents, paymentDeadlineDays }) {
        await this._assertFifteenDayGap(schoolId);

        let resolvedMax = maxStudents;
        if (!resolvedMax) {
            const school = await DrivingSchool.findById(schoolId).select('vehiclesCount').lean();
            resolvedMax = computeMaxStudents(school?.vehiclesCount);
        }
        if (!resolvedMax) {
            throw new ApiError(400, 'حدد الحد الأقصى للطلاب أو سجّل عدد مركبات المدرسة');
        }

        return TrainingCourse.create({
            schoolId,
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            maxStudents: resolvedMax,
            paymentDeadlineDays,
            status: COURSE_STATUS.REGISTRATION_OPEN,
            registrationOpen: true,
        });
    }

    async closeRegistration(courseId, schoolId = null) {
        const filter = { _id: courseId };
        if (schoolId) filter.schoolId = schoolId;

        const course = await TrainingCourse.findOneAndUpdate(
            filter,
            {
                status: COURSE_STATUS.REGISTRATION_CLOSED,
                registrationOpen: false,
                registrationClosedAt: new Date(),
            },
            { new: true },
        );
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);
        return course;
    }

    async resolvePreviousLaunchDate(courseId, previousLaunchDate = null) {
        if (previousLaunchDate) return new Date(previousLaunchDate);

        const course = await TrainingCourse.findById(courseId);
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        if (course.previousCourseId) {
            const prev = await TrainingCourse.findById(course.previousCourseId);
            if (prev?.launchDate) return prev.launchDate;
        }

        const lastLaunched = await TrainingCourse.findOne({
            schoolId: course.schoolId,
            launchDate: { $ne: null },
            _id: { $ne: courseId },
        })
            .sort({ launchDate: -1 })
            .select('launchDate')
            .lean();

        return lastLaunched?.launchDate || null;
    }

    async launch(courseId, previousLaunchDate, schoolId = null) {
        const filter = { _id: courseId };
        if (schoolId) filter.schoolId = schoolId;

        const courseBefore = await TrainingCourse.findOne(filter);
        if (!courseBefore) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        const resolvedPrevious = await this.resolvePreviousLaunchDate(courseId, previousLaunchDate);
        if (!courseHelper.canLaunchNewCourse(resolvedPrevious)) {
            throw new ApiError(400, ERR.COURSE_LAUNCH_TOO_EARLY);
        }

        const launchDate = new Date();
        const endDate = courseHelper.computeTrainingEnd(launchDate);

        const lastLaunched = await TrainingCourse.findOne({
            schoolId: courseBefore.schoolId,
            launchDate: { $ne: null },
            _id: { $ne: courseId },
        })
            .sort({ launchDate: -1 })
            .select('_id')
            .lean();

        const course = await TrainingCourse.findByIdAndUpdate(
            courseId,
            {
                status: COURSE_STATUS.ACTIVE,
                launchDate,
                endDate,
                previousCourseId: lastLaunched?._id || courseBefore.previousCourseId || null,
            },
            { new: true },
        );

        await Enrollment.updateMany(
            { courseId, status: ENROLLMENT_STATUS.PAID },
            { status: ENROLLMENT_STATUS.ACTIVE },
        );

        const paidEnrollments = await Enrollment.find({
            courseId,
            status: ENROLLMENT_STATUS.ACTIVE,
        }).select('userId categoryCode').lean();

        const contentService = require('./content.service');
        const launchLabel = launchDate.toLocaleDateString('ar-SY');
        for (const row of paidEnrollments) {
            await contentService.grantFullContentAccess(
                row.userId,
                row.categoryCode || course.categoryCode,
            );
            await sendInstant(row.userId, {
                type: NOTIFICATION_TYPES.COURSE_LAUNCH,
                title: 'انطلقت دورتك',
                message: `انطلقت دورة فئة ${course.categoryCode} بتاريخ ${launchLabel}. يمكنك متابعة التدريب.`,
                data: { courseId: course._id, launchDate },
            });
        }

        return course;
    }

    async getOpenCourses(schoolId, categoryCode = null) {
        const filter = {
            schoolId,
            registrationOpen: true,
            status: COURSE_STATUS.REGISTRATION_OPEN,
        };
        if (categoryCode) filter.categoryCode = categoryCode.toUpperCase();
        return TrainingCourse.find(filter).lean();
    }

    async listBySchool(schoolId, categoryCode = null) {
        const filter = { schoolId };
        if (categoryCode) filter.categoryCode = categoryCode.toUpperCase();
        return TrainingCourse.find(filter).sort({ createdAt: -1 }).lean();
    }

    async _resolvePricing(categoryCode, subTypeCode = null) {
        const code = String(categoryCode || '').toUpperCase();
        const sub = subTypeCode ? String(subTypeCode).toUpperCase() : null;

        let pricing = await PlatformPricing.findOne({
            categoryCode: code,
            subTypeCode: sub,
            isActive: true,
        })
            .sort({ effectiveFrom: -1 })
            .lean();

        if (!pricing && sub) {
            pricing = await PlatformPricing.findOne({
                categoryCode: code,
                subTypeCode: null,
                isActive: true,
            })
                .sort({ effectiveFrom: -1 })
                .lean();
        }

        if (!pricing) return null;
        return {
            _id: pricing._id,
            categoryCode: pricing.categoryCode,
            subTypeCode: pricing.subTypeCode,
            fixedPrice: pricing.fixedPrice,
            currency: pricing.currency,
            effectiveFrom: pricing.effectiveFrom,
        };
    }

    async getById(courseId, schoolId = null) {
        const filter = { _id: courseId };
        if (schoolId) filter.schoolId = schoolId;

        const course = await TrainingCourse.findOne(filter)
            .populate('schoolId', 'name address governorate vehiclesCount status')
            .populate('previousCourseId', 'categoryCode subTypeCode status launchDate endDate paidCount maxStudents')
            .lean();

        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        const resolvedSchoolId = course.schoolId?._id || course.schoolId;

        const [liveWaitlistCount, pricing, instructors] = await Promise.all([
            WaitingList.countDocuments({ courseId: course._id, status: 'waiting' }),
            this._resolvePricing(course.categoryCode, course.subTypeCode),
            Instructor.find({
                schoolId: resolvedSchoolId,
                status: 'active',
                licenseCategories: course.categoryCode,
            })
                .populate('userId', 'name email phone gender')
                .lean(),
        ]);

        const maxStudents = course.maxStudents ?? 0;
        const paidCount = course.paidCount ?? 0;

        return {
            ...course,
            waitlistCount: liveWaitlistCount,
            seatsRemaining: Math.max(0, maxStudents - paidCount),
            pricing,
            instructors: instructors.map((row) => ({
                _id: row._id,
                status: row.status,
                gender: row.gender,
                isFemaleCoach: row.isFemaleCoach,
                licenseCategories: row.licenseCategories,
                userId: row.userId,
            })),
        };
    }
}

module.exports = new CourseService();
