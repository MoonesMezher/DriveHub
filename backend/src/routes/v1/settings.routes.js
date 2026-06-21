const { Router } = require('express');
const { getPrivacy } = require('../../controllers/settings.controller');

const router = Router();

router.get('/privacy', getPrivacy);

module.exports = router;
