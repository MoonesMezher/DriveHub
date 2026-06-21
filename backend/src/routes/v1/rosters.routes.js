const { Router } = require('express');
const rosterController = require('../../controllers/roster.controller');
const { param } = require('express-validator');
const { validate } = require('../../middlewares/routeKit');

const router = Router();

router.get(
    '/verify/:token',
    param('token').trim().isLength({ min: 16, max: 128 }).withMessage('رمز التحقق غير صالح'),
    validate,
    rosterController.verify,
);

module.exports = router;
