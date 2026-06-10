const mongoose = require('mongoose');
const { DOCUMENT_TYPE_LIST } = require('../constants/documentTypes');

const documentUploadSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: DOCUMENT_TYPE_LIST, required: true },
        encryptedPath: { type: String, required: true, select: false },
        mime: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('DocumentUpload', documentUploadSchema);
