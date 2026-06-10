const mongoose = require('mongoose');

const questionOptionSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        text: { type: String, required: true },
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
        type: { type: String, enum: ['mcq', 'true_false'], required: true },
        options: [questionOptionSchema],
        correctAnswer: { type: String, required: true },
        explanation: { type: String, default: '' },
        imageUrl: { type: String, default: null },
        categoryCode: { type: String, default: null },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        status: { type: String, enum: ['active', 'archived'], default: 'active' },
    },
    { timestamps: true }
);

module.exports = { questionSchema, questionOptionSchema };
