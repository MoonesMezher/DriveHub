const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const locationService = require('../services/location.service');

const save = asyncHandler(async (req, res) => {
    const location = await locationService.save({
        userId: req._user.userId,
        ...req.body,
    });
    return success(res, { location }, { message: 'تم حفظ الموقع' });
});

const getLatest = asyncHandler(async (req, res) => {
    const location = await locationService.getLatest(req._user.userId);
    return success(res, { location });
});

module.exports = { save, getLatest };
