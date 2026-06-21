const mongoose = require('mongoose');
const { COURSE_STATUS, COURSE_DURATION_DAYS, DEFAULT_LAUNCH_AFTER_CLOSE_DAYS } = require('../constants/courseStatus');

const trainingCourseSchema = new mongoose.Schema(
    {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        maxStudents: { type: Number, required: true },
        paidCount: { type: Number, default: 0 },
        waitlistCount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: Object.values(COURSE_STATUS),
            default: COURSE_STATUS.REGISTRATION_OPEN,
        },
        registrationOpen: { type: Boolean, default: true },
        registrationClosedAt: { type: Date, default: null },
        launchDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        durationDays: { type: Number, default: COURSE_DURATION_DAYS },
        paymentDeadlineDays: { type: Number, default: 3 },
        launchAfterCloseDays: { type: Number, default: DEFAULT_LAUNCH_AFTER_CLOSE_DAYS },
        previousCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingCourse', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TrainingCourse', trainingCourseSchema);
