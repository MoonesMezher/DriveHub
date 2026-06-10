const mongoose = require('mongoose');

const LESSON_DURATION_MINUTES = 60;

const practicalLessonSchema = new mongoose.Schema(
    {
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true },
        scheduledAt: { type: Date, required: true },
        durationMinutes: { type: Number, default: LESSON_DURATION_MINUTES },
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
        rating: { type: Number, min: 1, max: 5, default: null },
        coachNotes: { type: String, default: null },
    },
    { timestamps: true }
);

practicalLessonSchema.index({ coachId: 1, scheduledAt: 1 });
practicalLessonSchema.index({ studentId: 1, scheduledAt: 1 });

module.exports = mongoose.model('PracticalLesson', practicalLessonSchema);
module.exports.LESSON_DURATION_MINUTES = LESSON_DURATION_MINUTES;
