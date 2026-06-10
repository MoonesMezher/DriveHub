const passwordService = require('../../../src/utils/passwordService');

describe('passwordService', () => {
    it('validates strong passwords', () => {
        expect(() => passwordService.validatePasswordStrength('Secure1!')).not.toThrow();
    });

    it('rejects short passwords', () => {
        expect(() => passwordService.validatePasswordStrength('Ab1!')).toThrow(/كلمة المرور ضعيفة/);
    });

    it('hashes and verifies passwords', async () => {
        const plain = 'SecurePass1!';
        const hashed = await passwordService.hashPassword(plain);
        expect(hashed).not.toBe(plain);
        expect(await passwordService.verifyPassword(plain, hashed)).toBe(true);
        expect(await passwordService.verifyPassword('wrong', hashed)).toBe(false);
    });
});
