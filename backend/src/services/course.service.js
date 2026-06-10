const { TrainingCourse, Enrollment } = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const courseHelper = require('../helpers/course.helper');

class CourseService {
    async create({ schoolId, categoryCode, subTypeCode, maxStudents, paymentDeadlineDays }) {
        return TrainingCourse.create({
            schoolId,
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            maxStudents,
            paymentDeadlineDays,
            status: COURSE_STATUS.REGISTRATION_OPEN,
            registrationOpen: true,
        });
    }

    async closeRegistration(courseId) {
        const course = await TrainingCourse.findByIdAndUpdate(
            courseId,
            { status: COURSE_STATUS.REGISTRATION_CLOSED, registrationOpen: false },
            { new: true },
        );
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);
        return course;
    }

    async launch(courseId, previousLaunchDate) {
        if (!courseHelper.canLaunchNewCourse(previousLaunchDate)) {
            throw new ApiError(400, ERR.COURSE_LAUNCH_TOO_EARLY);
        }

        const launchDate = new Date();
        const endDate = courseHelper.computeTrainingEnd(launchDate);

        const course = await TrainingCourse.findByIdAndUpdate(
            courseId,
            {
                status: COURSE_STATUS.ACTIVE,
                launchDate,
                endDate,
            },
            { new: true },
        );
        if (!course) throw new ApiError(404, ERR.COURSE_NOT_FOUND);

        await Enrollment.updateMany(
            { courseId, status: ENROLLMENT_STATUS.PAID },
            { status: ENROLLMENT_STATUS.ACTIVE },
        );

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
}

module.exports = new CourseService();
