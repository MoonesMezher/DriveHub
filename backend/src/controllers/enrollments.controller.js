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

const claimPayment = asyncHandler(async (req, res) => {
    const result = await paymentService.claim({
        enrollmentId: req.params.id,
        userId: req._user.userId,
        studentReference: req.body.studentReference,
    });
    return success(res, result, { message: 'تم تسجيل إعلامك بالدفع — بانتظار تأكيد المدرسة' });
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

const claimRetakePayment = asyncHandler(async (req, res) => {
    const result = await paymentService.claimRetake({
        enrollmentId: req.params.id,
        userId: req._user.userId,
        studentReference: req.body.studentReference,
    });
    return success(res, result, { message: 'تم تسجيل إعلامك بدفع الإعادة — بانتظار تأكيد المدرسة' });
});

const payFromWallet = asyncHandler(async (req, res) => {
    const result = await paymentService.payFromWallet({
        enrollmentId: req.params.id,
        userId: req._user.userId,
    });
    return success(res, result, { message: 'تم الدفع من الرصيد وحجز المقعد' });
});

const payRetakeFromWallet = asyncHandler(async (req, res) => {
    const result = await paymentService.payRetakeFromWallet({
        enrollmentId: req.params.id,
        userId: req._user.userId,
    });
    return success(res, result, { message: 'تم دفع الإعادة من الرصيد' });
});

module.exports = {
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
};
