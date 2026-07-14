const { Router } = require('express');
const { param } = require('express-validator');
const verificationController = require('../../controllers/verification.controller');
const { validate } = require('../../middlewares/routeKit');

const router = Router();

const tokenParam = param('token').trim().isLength({ min: 16, max: 128 }).withMessage('رمز التحقق غير صالح');

router.get('/statistics/:token', tokenParam, validate, verificationController.verifyStatistics);
router.get('/certificate/:token', tokenParam, validate, verificationController.verifyCertificate);
router.get('/roster/:token', tokenParam, validate, verificationController.verifyRoster);

module.exports = router;
