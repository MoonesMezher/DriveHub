const mongoose = require('mongoose');
const { questionSchema } = require('./schemas/question.schema');

const questionBankSchema = new mongoose.Schema(
    {
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', required: true, index: true },
        title: { type: String, required: true, trim: true },
        categoryCode: { type: String, required: true },
        subTypeCode: { type: String, default: null },
        questions: [questionSchema],
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('QuestionBank', questionBankSchema);
