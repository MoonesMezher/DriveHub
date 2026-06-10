const { Router } = require('express');
const {
    create,
    listMine,
    getById,
    cancel,
    initiatePayment,
    confirmPayment,
} = require('../../controllers/enrollments.controller');
const { createEnrollmentRules } = require('../../validators/enrollment.validator');
const { confirmPaymentRules } = require('../../validators/payment.validator');
const handleValidationErrors = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { requirePermission } = require('../../policies/authorize');
const { PERMISSIONS } = require('../../constants/permissions');
const { mongoIdParam } = require('../../validators/common.validator');
const id = require('../../middlewares/id');

const router = Router();

router.use(auth);

router.get('/', requirePermission(PERMISSIONS.SUBMIT_ENROLLMENT), listMine);
router.post('/', requirePermission(PERMISSIONS.SUBMIT_ENROLLMENT), createEnrollmentRules, handleValidationErrors, create);
router.get('/:id', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, getById);
router.delete('/:id', requirePermission(PERMISSIONS.CANCEL_PENDING_ENROLLMENT), mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, cancel);
router.post('/:id/payment/initiate', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, initiatePayment);
router.post('/:id/payment/confirm', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, confirmPaymentRules, handleValidationErrors, confirmPayment);

module.exports = router;
