const mongoose = require('mongoose');
const { ENROLLMENT_STATUS, RETAKE_SCOPE } = require('../constants/enrollmentStatus');

const enrollmentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCourse', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        status: {
            type: String,
            enum: Object.values(ENROLLMENT_STATUS),
            default: ENROLLMENT_STATUS.SUBMITTED,
        },
        retakeAttempt: { type: Number, default: 0 },
        retakeScope: { type: String, enum: Object.values(RETAKE_SCOPE), default: null },
        paymentDeadline: { type: Date, default: null },
        archiveRef: { type: mongoose.Schema.Types.ObjectId, ref: 'EnrollmentArchive', default: null },
        prefersFemaleCoach: { type: Boolean, default: false },
        managerVisible: { type: Boolean, default: true },
        cancelledAt: { type: Date, default: null },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true }
);

const PENDING_STATUSES = [
    ENROLLMENT_STATUS.SUBMITTED,
    ENROLLMENT_STATUS.UNDER_REVIEW,
    ENROLLMENT_STATUS.ACCEPTED,
    ENROLLMENT_STATUS.AWAITING_PAYMENT,
];

enrollmentSchema.index({ userId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1, createdAt: 1 });
enrollmentSchema.index(
    { userId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: PENDING_STATUSES } },
        name: 'one_pending_enrollment_per_user',
    }
);

module.exports = mongoose.model('Enrollment', enrollmentSchema);
