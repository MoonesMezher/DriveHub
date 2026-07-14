const { requiredInt, optionalString, requiredEnumBody, mongoIdBody } = require('./chains');

const claimPaymentRules = [
    optionalString('studentReference', 'مرجع التحويل أو الإيصال', { max: 200 }),
];

const confirmPaymentRules = [
    requiredInt('amount', 'المبلغ', { min: 1 }),
    optionalString('gatewayRef', 'مرجع الدفع الداخلي', { max: 200 }),
];

const retakePaymentRules = [
    mongoIdBody('enrollmentId', 'طلب الاشتراك'),
    requiredInt('attemptNumber', 'رقم المحاولة', { min: 1, max: 20 }),
    requiredEnumBody('type', 'نوع الدفع', ['initial', 'retake']),
];

const walletCreditRules = [
    requiredInt('amount', 'المبلغ', { min: 1 }),
    optionalString('note', 'ملاحظة أو مرجع إيصال', { max: 500 }),
];

module.exports = {
    claimPaymentRules,
    confirmPaymentRules,
    retakePaymentRules,
    walletCreditRules,
};
