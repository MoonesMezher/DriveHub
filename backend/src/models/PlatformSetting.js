const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, trim: true, index: true },
        value: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true },
);

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
