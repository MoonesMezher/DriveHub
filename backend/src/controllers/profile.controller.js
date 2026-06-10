const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { userService } = require('../services');

const getProfile = asyncHandler(async (req, res) => {
    const profile = await userService.getProfile(req._user.userId);
    return success(res, { profile });
});

const updateProfile = asyncHandler(async (req, res) => {
    const profile = await userService.updateProfile(req._user.userId, req.body);
    return success(res, { profile }, { message: 'تم تحديث الملف الشخصي' });
});

module.exports = { getProfile, updateProfile };
