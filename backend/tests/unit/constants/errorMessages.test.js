const { ERR } = require('../../../src/constants/errorMessages');
const { mapMongooseError } = require('../../../src/utils/mongooseErrors');

describe('Arabic error messages', () => {
    it('exports key Arabic messages', () => {
        expect(ERR.UNAUTHORIZED).toMatch(/غير مصرّح/);
        expect(ERR.ENROLLMENT_PENDING_EXISTS).toMatch(/معلّق/);
        expect(ERR.PAYMENT_DEADLINE_EXPIRED).toMatch(/مهلة الدفع/);
    });

    it('maps duplicate key to Arabic', () => {
        const err = { code: 11000, keyPattern: { email: 1 } };
        const mapped = mapMongooseError(err);
        expect(mapped.message).toMatch(/مكررة/);
        expect(mapped.message).toMatch(/البريد/);
    });
});
