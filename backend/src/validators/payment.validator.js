const { requiredInt, optionalString, requiredEnumBody, mongoIdBody } = require('./chains');

const confirmPaymentRules = [
    requiredInt('amount', 'المبلغ', { min: 1 }),
    optionalString('gatewayRef', 'مرجع الدفع', { max: 200 }),
];

const retakePaymentRules = [
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    requiredInt('attemptNumber', 'رقم المحاولة', { min: 1, max: 20 }),
    requiredEnumBody('type', 'نوع الدفع', ['initial', 'retake']),
];

module.exports = {
    confirmPaymentRules,
    retakePaymentRules,
};
