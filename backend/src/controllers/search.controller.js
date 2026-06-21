const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const searchService = require('../services/search.service');

const globalSearch = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const data = await searchService.search({
        role: req._user.role,
        userId: req._user.userId,
        schoolId: req._user.schoolId || null,
        query: q,
    });
    return success(res, data);
});

module.exports = { globalSearch };
