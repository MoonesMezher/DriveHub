const mongoose = require('mongoose');
const { ROLE_LIST } = require('../constants/roles');

const userRoleSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        role: { type: String, enum: ROLE_LIST, required: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', default: null },
        licenseCategories: [{ type: String }],
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    },
    { timestamps: true }
);

userRoleSchema.index({ userId: 1, role: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('UserRole', userRoleSchema);
