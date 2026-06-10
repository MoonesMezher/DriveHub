const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');

const activeContextSchema = new mongoose.Schema(
    {
        role: { type: String, enum: Object.values(ROLES), default: ROLES.REGISTERED },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'DrivingSchool', default: null },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        password: { type: String, required: true, select: false },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
        profileData: { type: mongoose.Schema.Types.Mixed, default: {} },
        activeContext: { type: activeContextSchema, default: () => ({ role: ROLES.REGISTERED }) },
    },
    { timestamps: true }
);

userSchema.methods.isSuspended = function isSuspended() {
    return this.status === 'suspended';
};

module.exports = mongoose.model('User', userSchema);
