const mongoose = require('mongoose');

const documentAccessLogSchema = new mongoose.Schema(
    {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentUpload', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, enum: ['view', 'download'], default: 'view' },
        ip: { type: String, default: null },
        userAgent: { type: String, default: null },
    },
    { timestamps: { createdAt: 'at', updatedAt: false } },
);

module.exports = mongoose.model('DocumentAccessLog', documentAccessLogSchema);
