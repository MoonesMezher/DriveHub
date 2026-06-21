const { ENROLLMENT_STATUS, RETAKE_SCOPE } = require('../constants/enrollmentStatus');

/**
 * يحدد حالة الاشتراك بعد نتيجة امتحان مرور (نظري/عملي).
 * رسوب عملي بعد نجاح نظري يبقي final_theory_passed (مطابق لـ exam.service).
 */
function resolveTrafficResultStatus(enrollment, { examType, passed }) {
    if (passed && examType === 'theory') {
        return { status: ENROLLMENT_STATUS.FINAL_THEORY_PASSED, retakeScope: null };
    }
    if (passed && examType === 'practical') {
        return { status: ENROLLMENT_STATUS.FINAL_PASSED, retakeScope: null };
    }
    if (!passed && examType === 'theory') {
        return { status: ENROLLMENT_STATUS.FINAL_FAILED_THEORY, retakeScope: RETAKE_SCOPE.FULL };
    }
    if (!passed && examType === 'practical') {
        if (enrollment.status === ENROLLMENT_STATUS.FINAL_THEORY_PASSED) {
            return {
                status: ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
                needsRetakeScope: true,
            };
        }
        return { status: ENROLLMENT_STATUS.FINAL_FAILED_THEORY, retakeScope: RETAKE_SCOPE.FULL };
    }
    return null;
}

module.exports = { resolveTrafficResultStatus };
