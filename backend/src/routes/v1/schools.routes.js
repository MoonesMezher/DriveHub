const { Router } = require('express');
const { getMap, getNearby, getById, getCourses, getCoaches } = require('../../controllers/schools.controller');
const { mongoIdParam } = require('../../validators/common.validator');
const { mapSchoolsQuery, nearbySchoolsQuery } = require('../../validators/location.validator');
const handleValidationErrors = require('../../middlewares/validate');
const attachPagination = require('../../middlewares/pagination');
const optionalAuth = require('../../middlewares/optionalAuth');
const id = require('../../middlewares/id');

const router = Router();

router.get('/map', optionalAuth, mapSchoolsQuery, handleValidationErrors, getMap);
router.get('/nearby', optionalAuth, attachPagination, nearbySchoolsQuery, handleValidationErrors, getNearby);
router.get('/:id/courses', optionalAuth, mongoIdParam('id'), handleValidationErrors, id, getCourses);
router.get('/:id/coaches', optionalAuth, mongoIdParam('id'), handleValidationErrors, id, getCoaches);
router.get('/:id', optionalAuth, mongoIdParam('id'), handleValidationErrors, id, getById);

module.exports = router;
