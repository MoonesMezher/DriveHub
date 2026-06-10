const { Router } = require('express');
const { getSample } = require('../../controllers/content.controller');
const optionalAuth = require('../../middlewares/optionalAuth');

const router = Router();

router.get('/sample', optionalAuth, getSample);

module.exports = router;
