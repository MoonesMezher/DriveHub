const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { pick } = require('../utils/pick');

class UserService {
    async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);
        return pick(user.toObject(), ['_id', 'name', 'email', 'phone', 'status', 'walletBalance', 'profileData', 'activeContext']);
    }

    async updateProfile(userId, payload) {
        const allowed = pick(payload, ['name', 'phone', 'profileData']);
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        if (allowed.name !== undefined) user.name = allowed.name;
        if (allowed.phone !== undefined) user.phone = allowed.phone;

        if (allowed.profileData && typeof allowed.profileData === 'object') {
            const current = user.profileData && typeof user.profileData === 'object'
                ? (typeof user.profileData.toObject === 'function'
                    ? user.profileData.toObject()
                    : { ...user.profileData })
                : {};
            const next = { ...current, ...allowed.profileData };
            if (Object.prototype.hasOwnProperty.call(allowed.profileData, 'avatar')) {
                const avatar = allowed.profileData.avatar;
                next.avatar = avatar ? String(avatar) : null;
            }
            user.profileData = next;
            user.markModified('profileData');
        }

        await user.save();
        return this.getProfile(userId);
    }
}

module.exports = new UserService();
