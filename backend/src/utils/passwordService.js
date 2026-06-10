const bcrypt = require('bcryptjs');
const { ERR } = require('../constants/errorMessages');

class PasswordService {
    async hashPassword(password) {
        return bcrypt.hash(password, 12);
    }

    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    validatePasswordStrength(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            const err = new Error(ERR.PASSWORD_WEAK);
            err.statusCode = 400;
            throw err;
        }

        return true;
    }
}

module.exports = new PasswordService();
