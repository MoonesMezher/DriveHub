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
        const user = await User.findByIdAndUpdate(userId, allowed, { new: true, runValidators: true });
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);
        return this.getProfile(userId);
    }
}

module.exports = new UserService();
