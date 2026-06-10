const mongoose = require('mongoose');
const { questionSchema } = require('./schemas/question.schema');

const theoryContentSchema = new mongoose.Schema(
    {
        categoryCode: { type: String, required: true, index: true },
        subTypeCode: { type: String, default: null },
        phase: { type: Number, required: true, min: 1 },
        title: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        order: { type: Number, default: 0 },
        isSample: { type: Boolean, default: false },
        sampleTier: { type: String, enum: ['partial', 'full'], default: null },
        interactiveQuestions: [questionSchema],
        unlockMode: { type: String, enum: ['progressive', 'full'], default: 'progressive' },
        isActive: { type: Boolean, default: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

theoryContentSchema.index({ categoryCode: 1, phase: 1, order: 1 });

module.exports = mongoose.model('TheoryContent', theoryContentSchema);
