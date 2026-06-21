const { resolveTrafficResultStatus } = require('../../../src/helpers/trafficResult.helper');
const { ENROLLMENT_STATUS, RETAKE_SCOPE } = require('../../../src/constants/enrollmentStatus');

describe('resolveTrafficResultStatus', () => {
    const baseEnrollment = { status: ENROLLMENT_STATUS.ACTIVE };

    it('theory pass → final_theory_passed', () => {
        const result = resolveTrafficResultStatus(baseEnrollment, { examType: 'theory', passed: true });
        expect(result.status).toBe(ENROLLMENT_STATUS.FINAL_THEORY_PASSED);
        expect(result.retakeScope).toBeNull();
    });

    it('practical pass → final_passed', () => {
        const enrollment = { status: ENROLLMENT_STATUS.FINAL_THEORY_PASSED };
        const result = resolveTrafficResultStatus(enrollment, { examType: 'practical', passed: true });
        expect(result.status).toBe(ENROLLMENT_STATUS.FINAL_PASSED);
    });

    it('theory fail → final_failed_theory + full retake', () => {
        const result = resolveTrafficResultStatus(baseEnrollment, { examType: 'theory', passed: false });
        expect(result.status).toBe(ENROLLMENT_STATUS.FINAL_FAILED_THEORY);
        expect(result.retakeScope).toBe(RETAKE_SCOPE.FULL);
    });

    it('practical fail after theory passed → stays final_theory_passed', () => {
        const enrollment = { status: ENROLLMENT_STATUS.FINAL_THEORY_PASSED };
        const result = resolveTrafficResultStatus(enrollment, { examType: 'practical', passed: false });
        expect(result.status).toBe(ENROLLMENT_STATUS.FINAL_THEORY_PASSED);
        expect(result.needsRetakeScope).toBe(true);
    });

    it('practical fail without theory passed → final_failed_theory', () => {
        const result = resolveTrafficResultStatus(baseEnrollment, { examType: 'practical', passed: false });
        expect(result.status).toBe(ENROLLMENT_STATUS.FINAL_FAILED_THEORY);
        expect(result.retakeScope).toBe(RETAKE_SCOPE.FULL);
    });
});
