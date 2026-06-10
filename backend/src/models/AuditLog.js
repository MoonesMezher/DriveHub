const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        requestId: { type: String, default: null },
        method: { type: String, default: null },
        path: { type: String, default: null },
        ip: { type: String, default: null },
        entityType: { type: String, default: null },
        entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        at: { type: Date, default: Date.now, index: true },
    },
    { timestamps: false }
);

auditLogSchema.index({ at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
