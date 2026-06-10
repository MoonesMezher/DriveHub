const mongoose = require('mongoose');

const coachNoteSchema = new mongoose.Schema(
    {
        coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true },
        lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticalLesson', default: null },
        personalNotes: { type: String, default: '' },
        lessonRating: { type: Number, min: 1, max: 5, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CoachNote', coachNoteSchema);
