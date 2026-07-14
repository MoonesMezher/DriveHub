const { Router } = require('express');
const {
    create,
    listMine,
    getById,
    cancel,
    initiatePayment,
    claimPayment,
    createRetake,
    initiateRetakePayment,
    claimRetakePayment,
    payFromWallet,
    payRetakeFromWallet,
} = require('../../controllers/enrollments.controller');
const { createEnrollmentRules, retakeEnrollmentRules } = require('../../validators/enrollment.validator');
const { claimPaymentRules } = require('../../validators/payment.validator');
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
router.post('/retake', requirePermission(PERMISSIONS.SUBMIT_ENROLLMENT), retakeEnrollmentRules, handleValidationErrors, createRetake);
router.get('/:id', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, getById);
router.delete('/:id', requirePermission(PERMISSIONS.CANCEL_PENDING_ENROLLMENT), mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, cancel);
router.post('/:id/payment/initiate', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, initiatePayment);
router.post('/:id/payment/claim', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, claimPaymentRules, handleValidationErrors, claimPayment);
router.post('/:id/pay-from-wallet', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, payFromWallet);
router.post('/:id/payment/retake/initiate', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, initiateRetakePayment);
router.post('/:id/payment/retake/claim', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, claimPaymentRules, handleValidationErrors, claimRetakePayment);
router.post('/:id/payment/retake/pay-from-wallet', mongoIdParam('id', 'طلب الاشتراك'), handleValidationErrors, id, payRetakeFromWallet);

module.exports = router;
