const { Router } = require('express');
const { save, getLatest } = require('../../controllers/location.controller');
const { saveLocationRules } = require('../../validators/location.validator');
const handleValidationErrors = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');

const router = Router();

router.use(auth);
router.post('/', saveLocationRules, handleValidationErrors, save);
router.get('/', getLatest);

module.exports = router;
