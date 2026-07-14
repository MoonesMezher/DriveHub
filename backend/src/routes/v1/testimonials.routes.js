const { Router } = require('express');
const testimonialController = require('../../controllers/testimonial.controller');

const router = Router();

router.get('/', testimonialController.listPublic);

module.exports = router;
