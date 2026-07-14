const { TrainingCourse, Enrollment, DrivingSchool } = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const courseHelper = require('../helpers/course.helper');
const { computeMaxStudents } = require('../constants/courseCapacity');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { sendInstant } = require('../helpers/notificationDelivery.helper');

class CourseService {
    async create({ schoolId, categoryCode, subTypeCode, maxStudents, paymentDeadlineDays, launchAfterCloseDays }) {
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
            launchAfterCloseDays,
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

        if (courseBefore.registrationClosedAt) {
            const { earliestLaunch } = courseHelper.computeLaunchWindow(
                courseBefore,
                courseBefore.registrationClosedAt,
            );
            if (new Date() < earliestLaunch) {
                throw new ApiError(400, ERR.COURSE_LAUNCH_BEFORE_WINDOW, { earliestLaunch });
            }
        }

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
}

module.exports = new CourseService();
