const ENROLLMENT_STATUS = {
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    ACCEPTED: 'accepted',
    AWAITING_PAYMENT: 'awaiting_payment',
    PAID: 'paid',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    EXAM_PENDING: 'exam_pending',
    FINAL_PASSED: 'final_passed',
    FINAL_FAILED_THEORY: 'final_failed_theory',
    FINAL_THEORY_PASSED: 'final_theory_passed',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};

const RETAKE_SCOPE = {
    FULL: 'full',
    PRACTICAL_ONLY: 'practical_only',
};

module.exports = { ENROLLMENT_STATUS, RETAKE_SCOPE };
