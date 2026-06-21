const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { schoolService } = require('../services');

const getMap = asyncHandler(async (req, res) => {
    const { lat, lng, category, femaleCoach } = req.query;
    const schools = await schoolService.findForMap({ lat, lng, category, femaleCoach });
    return success(res, { schools });
});

const getNearby = asyncHandler(async (req, res) => {
    const { lat, lng, category, femaleCoach } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }
    const result = await schoolService.findNearby({
        lat, lng, category, femaleCoach, query: req.query,
    });
    return success(res, result.items, { meta: { pagination: result.pagination } });
});

const getById = asyncHandler(async (req, res) => {
    const school = await schoolService.getById(req.params.id);
    return success(res, school);
});

const getCourses = asyncHandler(async (req, res) => {
    const courses = await schoolService.getOpenCourses(req.params.id, req.query.category);
    return success(res, { courses });
});

const getCoaches = asyncHandler(async (req, res) => {
    const coaches = await schoolService.getCoaches(req.params.id);
    return success(res, { coaches });
});

module.exports = { getMap, getNearby, getById, getCourses, getCoaches };
