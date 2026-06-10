const { Router } = require('express');
const reviewsController = require('../../controllers/reviews.controller');
const { createReviewRules } = require('../../validators/review.validator');
const { auth, validate, idParam, mongoIdParam, requirePermission } = require('../../middlewares/routeKit');
const { PERMISSIONS } = require('../../constants/permissions');

const router = Router();

router.get('/school/:schoolId', mongoIdParam('schoolId', 'المدرسة'), validate, reviewsController.listBySchool);
router.post('/', auth, requirePermission(PERMISSIONS.VIEW_SCHOOLS), createReviewRules, validate, reviewsController.create);

module.exports = router;
