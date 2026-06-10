const { Enrollment } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { getRetakePaymentPercentage } = require('../utils/retakePayment');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const ACTIVE_STUDENT_STATUSES = [
    ENROLLMENT_STATUS.PAID,
    ENROLLMENT_STATUS.ACTIVE,
    ENROLLMENT_STATUS.COMPLETED,
    ENROLLMENT_STATUS.EXAM_PENDING,
    ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
    ENROLLMENT_STATUS.FINAL_PASSED,
    ENROLLMENT_STATUS.FINAL_FAILED_THEORY,
];

const PENDING_STATUSES = new Set([
    ENROLLMENT_STATUS.SUBMITTED,
    ENROLLMENT_STATUS.UNDER_REVIEW,
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.AWAITING_PAYMENT,
]);

const hasPendingEnrollment = (enrollments = []) =>
    enrollments.some((e) => PENDING_STATUSES.has(e.status));

const getAvailableSpots = (course) => Math.max(0, course.maxStudents - course.paidCount);

const filterRequestsForManager = (requests, availableSpots) =>
    [...requests]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, availableSpots);

const getRetakePaymentInfo = (basePrice, attemptNumber) => ({
    attemptNumber,
    percentage: getRetakePaymentPercentage(attemptNumber),
    amount: Math.round((basePrice * getRetakePaymentPercentage(attemptNumber)) / 100),
});

const getActiveEnrollment = async (userId, { required = false } = {}) => {
    const enrollment = await Enrollment.findOne({
        userId,
        status: { $in: ACTIVE_STUDENT_STATUSES },
    })
        .sort({ updatedAt: -1 })
        .populate('schoolId', 'name')
        .populate('courseId', 'categoryCode subTypeCode status launchDate endDate');

    if (required && !enrollment) {
        throw new ApiError(400, ERR.ACTIVE_ENROLLMENT_REQUIRED);
    }
    return enrollment;
};

module.exports = {
    ACTIVE_STUDENT_STATUSES,
    PENDING_STATUSES,
    hasPendingEnrollment,
    getAvailableSpots,
    filterRequestsForManager,
    getRetakePaymentInfo,
    getActiveEnrollment,
};
