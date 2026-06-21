const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const { enrollmentService, paymentService } = require('../services');

const create = asyncHandler(async (req, res) => {
    const enrollment = await enrollmentService.create({
        userId: req._user.userId,
        ...req.body,
    });
    return created(res, { enrollment }, 'تم إرسال طلب الاشتراك');
});

const listMine = asyncHandler(async (req, res) => {
    const enrollments = await enrollmentService.listMine(req._user.userId);
    return success(res, { enrollments });
});

const getById = asyncHandler(async (req, res) => {
    const enrollment = await enrollmentService.getById(req.params.id, req._user.userId);
    return success(res, { enrollment });
});

const cancel = asyncHandler(async (req, res) => {
    const enrollment = await enrollmentService.cancel(req.params.id, req._user.userId);
    return success(res, { enrollment }, { message: 'تم إلغاء الطلب' });
});

const initiatePayment = asyncHandler(async (req, res) => {
    const result = await paymentService.initiate({
        enrollmentId: req.params.id,
        userId: req._user.userId,
    });
    return success(res, result);
});

const confirmPayment = asyncHandler(async (req, res) => {
    const result = await paymentService.confirm({
        enrollmentId: req.params.id,
        userId: req._user.userId,
        amount: req.body.amount,
        gatewayRef: req.body.gatewayRef,
    });
    return success(res, result, { message: 'تم تأكيد الدفع بنجاح' });
});

const createRetake = asyncHandler(async (req, res) => {
    const enrollment = await enrollmentService.createRetake({
        userId: req._user.userId,
        priorEnrollmentId: req.body.priorEnrollmentId,
        retakeScope: req.body.retakeScope,
    });
    return created(res, { enrollment }, 'تم إنشاء طلب إعادة الاشتراك');
});

const initiateRetakePayment = asyncHandler(async (req, res) => {
    const result = await paymentService.initiateRetake({
        enrollmentId: req.params.id,
        userId: req._user.userId,
    });
    return success(res, result);
});

const confirmRetakePayment = asyncHandler(async (req, res) => {
    const result = await paymentService.confirmRetake({
        enrollmentId: req.params.id,
        userId: req._user.userId,
        amount: req.body.amount,
        gatewayRef: req.body.gatewayRef,
    });
    return success(res, result, { message: 'تم تأكيد دفع الإعادة بنجاح' });
});

module.exports = {
    create,
    listMine,
    getById,
    cancel,
    initiatePayment,
    confirmPayment,
    createRetake,
    initiateRetakePayment,
    confirmRetakePayment,
};
