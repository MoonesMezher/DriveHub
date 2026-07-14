const { Router } = require('express');
const adsController = require('../../controllers/ads.controller');

const router = Router();

router.get('/', adsController.listActive);

module.exports = router;
