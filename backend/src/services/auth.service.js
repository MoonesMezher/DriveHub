const crypto = require('crypto');
const { User, UserRole, RefreshToken, PasswordResetToken } = require('../models');
const passwordService = require('../utils/passwordService');
const jwtService = require('../utils/jwtService');
const { hashToken } = require('../utils/tokenHash');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { ROLES } = require('../constants/roles');
const { LOGIN_PORTALS, getEffectivePermissions } = require('../constants/rolePermissions');
const { getDefaultRouteForRole } = require('../constants/portals');
const logger = require('../utils/logger');
const notificationChannels = require('./notificationChannels');

const RESET_CODE_TTL_MINUTES = Number(process.env.PASSWORD_RESET_CODE_TTL_MINUTES || 10);
const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 15);
const RESET_MAX_ATTEMPTS = Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 5);

class AuthService {
    generateOtpCode() {
        return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    }

    hashCode(code) {
        return crypto.createHash('sha256').update(String(code)).digest('hex');
    }

    async forgotPassword({ email }) {
        const normalizedEmail = String(email || '').toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select('_id email');
        if (!user) return;

        const code = this.generateOtpCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + RESET_CODE_TTL_MINUTES * 60 * 1000);

        await PasswordResetToken.findOneAndUpdate(
            { email: normalizedEmail, consumedAt: null },
            {
                email: normalizedEmail,
                userId: user._id,
                codeHash: this.hashCode(code),
                expiresAt,
                consumedAt: null,
                attemptCount: 0,
                maxAttempts: RESET_MAX_ATTEMPTS,
                lastRequestedAt: now,
                resetTokenHash: null,
                resetTokenExpiresAt: null,
            },
            { upsert: true, setDefaultsOnInsert: true },
        );

        try {
            await notificationChannels.sendEmail({
                to: user.email,
                subject: 'رمز إعادة تعيين كلمة المرور - DriveHub',
                text: `رمز التحقق الخاص بك هو: ${code}\nصالح لمدة ${RESET_CODE_TTL_MINUTES} دقائق.\nإذا لم تطلب هذا الإجراء، تجاهل هذه الرسالة.`,
            });
        } catch (err) {
            logger.error('password_reset.email_failed', {
                email: normalizedEmail,
                error: err.message,
            });
            // eslint-disable-next-line no-console
            console.log(`[DriveHub] Password reset code for ${normalizedEmail}: ${code}`);
        }

        // Kill-switch / no SMTP: OTP must remain usable via console even when sendEmail does not throw.
        if (!notificationChannels.isEmailEnabled()) {
            // eslint-disable-next-line no-console
            console.log(`[DriveHub] Password reset code for ${normalizedEmail}: ${code}`);
        }
    }

    async verifyResetCode({ email, code }) {
        const normalizedEmail = String(email || '').toLowerCase().trim();
        const tokenDoc = await PasswordResetToken.findOne({ email: normalizedEmail, consumedAt: null });
        if (!tokenDoc || tokenDoc.expiresAt <= new Date()) {
            throw new ApiError(400, ERR.RESET_CODE_INVALID);
        }
        if (tokenDoc.attemptCount >= tokenDoc.maxAttempts) {
            throw new ApiError(429, ERR.RESET_CODE_ATTEMPTS_EXCEEDED);
        }

        const codeHash = this.hashCode(code);
        if (codeHash !== tokenDoc.codeHash) {
            tokenDoc.attemptCount += 1;
            await tokenDoc.save();
            if (tokenDoc.attemptCount >= tokenDoc.maxAttempts) {
                throw new ApiError(429, ERR.RESET_CODE_ATTEMPTS_EXCEEDED);
            }
            throw new ApiError(400, ERR.RESET_CODE_INVALID);
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        tokenDoc.resetTokenHash = hashToken(resetToken);
        tokenDoc.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
        await tokenDoc.save();

        return {
            verified: true,
            resetToken,
            expiresInSeconds: RESET_TOKEN_TTL_MINUTES * 60,
        };
    }

    async resetPassword({ email, code, resetToken, newPassword }) {
        const normalizedEmail = String(email || '').toLowerCase().trim();
        const tokenDoc = await PasswordResetToken.findOne({ email: normalizedEmail, consumedAt: null });
        if (!tokenDoc || tokenDoc.expiresAt <= new Date()) {
            throw new ApiError(400, ERR.RESET_TOKEN_INVALID);
        }

        if (tokenDoc.attemptCount >= tokenDoc.maxAttempts) {
            throw new ApiError(429, ERR.RESET_CODE_ATTEMPTS_EXCEEDED);
        }

        const now = new Date();
        let isValid = false;
        if (resetToken) {
            isValid = tokenDoc.resetTokenHash
                && tokenDoc.resetTokenHash === hashToken(resetToken)
                && tokenDoc.resetTokenExpiresAt
                && tokenDoc.resetTokenExpiresAt > now;
        } else if (code) {
            isValid = this.hashCode(code) === tokenDoc.codeHash;
            if (!isValid) {
                tokenDoc.attemptCount += 1;
                await tokenDoc.save();
            }
        }

        if (!isValid) {
            if (tokenDoc.attemptCount >= tokenDoc.maxAttempts) {
                throw new ApiError(429, ERR.RESET_CODE_ATTEMPTS_EXCEEDED);
            }
            throw new ApiError(400, ERR.RESET_TOKEN_INVALID);
        }

        passwordService.validatePasswordStrength(newPassword);
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (user) {
            user.password = await passwordService.hashPassword(newPassword);
            await user.save();
            await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
        }

        tokenDoc.consumedAt = new Date();
        tokenDoc.resetTokenHash = null;
        tokenDoc.resetTokenExpiresAt = null;
        await tokenDoc.save();

        return { success: true };
    }

    async register({ name, email, phone, password }) {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            throw new ApiError(409, ERR.EMAIL_EXISTS);
        }

        try {
            passwordService.validatePasswordStrength(password);
        } catch (e) {
            throw new ApiError(e.statusCode || 400, e.message);
        }

        const hashedPassword = await passwordService.hashPassword(password);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            activeContext: { role: ROLES.REGISTERED, schoolId: null },
        });

        await UserRole.create({ userId: user._id, role: ROLES.REGISTERED });

        return this.issueSession(user, { userAgent: null });
    }

    async login({ email, password, portal }, meta = {}) {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            throw new ApiError(401, ERR.INVALID_CREDENTIALS);
        }

        if (user.isSuspended()) {
            throw new ApiError(403, ERR.ACCOUNT_SUSPENDED);
        }

        const isValid = await passwordService.verifyPassword(password, user.password);
        if (!isValid) {
            throw new ApiError(401, ERR.INVALID_CREDENTIALS);
        }

        if (portal && LOGIN_PORTALS[portal]) {
            const roles = await this.getActiveRoles(user._id);
            const roleNames = roles.map((r) => r.role);
            const allowed = LOGIN_PORTALS[portal];
            const canAccessPortal = roleNames.some((r) => allowed.includes(r));
            if (!canAccessPortal) {
                throw new ApiError(403, ERR.PORTAL_DENIED);
            }
            // Prefer the most specific portal role the user holds (STUDENT before REGISTERED).
            const preferredRole = allowed.find((r) => roleNames.includes(r)) || user.activeContext?.role;
            if (preferredRole && user.activeContext?.role !== preferredRole) {
                user.activeContext = {
                    role: preferredRole,
                    schoolId: roles.find((r) => r.role === preferredRole)?.schoolId || null,
                };
                await user.save();
            }
        }

        return this.issueSession(user, meta);
    }

    async logout({ refreshToken, userId }) {
        if (refreshToken) {
            const tokenHash = hashToken(refreshToken);
            await RefreshToken.updateOne(
                { tokenHash, userId, revokedAt: null },
                { revokedAt: new Date() },
            );
        } else if (userId) {
            await RefreshToken.updateMany(
                { userId, revokedAt: null },
                { revokedAt: new Date() },
            );
        }
        return { success: true };
    }

    async refreshSession(refreshToken, meta = {}) {
        let decoded;
        try {
            decoded = jwtService.verifyRefreshToken(refreshToken);
        } catch {
            throw new ApiError(401, ERR.INVALID_REFRESH_TOKEN);
        }

        const tokenHash = hashToken(refreshToken);
        const stored = await RefreshToken.findOne({ tokenHash, userId: decoded.userId });

        if (!stored || !stored.isValid()) {
            throw new ApiError(401, ERR.REFRESH_REVOKED);
        }

        const user = await User.findById(decoded.userId);
        if (!user || user.isSuspended()) {
            throw new ApiError(401, ERR.UNAUTHORIZED);
        }

        stored.revokedAt = new Date();
        await stored.save();

        const session = await this.issueSession(user, meta);

        await RefreshToken.updateOne(
            { _id: stored._id },
            { replacedByTokenHash: hashToken(session.refreshToken) },
        );

        return session;
    }

    async getMe(userId) {
        const user = await User.findById(userId);
        if (!user || user.isSuspended()) {
            throw new ApiError(401, ERR.UNAUTHORIZED);
        }
        return this.buildUserPayload(user);
    }

    async getContexts(userId) {
        const roles = await this.getActiveRoles(userId);
        return roles.map((r) => ({
            role: r.role,
            schoolId: r.schoolId,
            label: r.role,
            homeRoute: getDefaultRouteForRole(r.role),
        }));
    }

    async switchContext(userId, { role, schoolId = null }) {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, ERR.USER_NOT_FOUND);
        }

        const roles = await this.getActiveRoles(userId);
        const match = roles.find(
            (r) => r.role === role && String(r.schoolId || '') === String(schoolId || ''),
        );

        if (!match && role !== ROLES.REGISTERED) {
            const hasRole = roles.some((r) => r.role === role);
            if (!hasRole) {
                throw new ApiError(403, ERR.ROLE_NOT_ASSIGNED);
            }
        }

        user.activeContext = { role, schoolId: schoolId || null };
        await user.save();

        return this.issueAccessOnly(user);
    }

    async issueSession(user, meta = {}) {
        const payload = await this.buildUserPayload(user);
        const accessToken = jwtService.generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
            role: payload.activeContext.role,
            schoolId: payload.activeContext.schoolId?.toString() || null,
            roles: payload.roles.map((r) => ({
                role: r.role,
                schoolId: r.schoolId?.toString() || null,
            })),
            permissions: payload.permissions,
        });

        const refreshToken = jwtService.generateRefreshToken({ userId: user._id.toString() });
        await RefreshToken.create({
            userId: user._id,
            tokenHash: hashToken(refreshToken),
            expiresAt: jwtService.getRefreshExpiryDate(),
            userAgent: meta.userAgent || null,
        });

        return {
            accessToken,
            refreshToken,
            token: accessToken,
            user: payload,
            homeRoute: getDefaultRouteForRole(payload.activeContext.role),
        };
    }

    async issueAccessOnly(user) {
        const payload = await this.buildUserPayload(user);
        const accessToken = jwtService.generateAccessToken({
            userId: user._id.toString(),
            email: user.email,
            role: payload.activeContext.role,
            schoolId: payload.activeContext.schoolId?.toString() || null,
            roles: payload.roles.map((r) => ({
                role: r.role,
                schoolId: r.schoolId?.toString() || null,
            })),
            permissions: payload.permissions,
        });

        return {
            accessToken,
            token: accessToken,
            user: payload,
            homeRoute: getDefaultRouteForRole(payload.activeContext.role),
        };
    }

    async buildUserPayload(user) {
        const roles = await this.getActiveRoles(user._id);
        const roleNames = roles.map((r) => r.role);

        let activeContext = {
            role: user.activeContext?.role || ROLES.REGISTERED,
            schoolId: user.activeContext?.schoolId || null,
        };

        // After payment the STUDENT role exists; keep session on STUDENT so
        // LEARN_CONTENT / student portal are not blocked by a stale REGISTERED context.
        if (activeContext.role === ROLES.REGISTERED && roleNames.includes(ROLES.STUDENT)) {
            const studentRole = roles.find((r) => r.role === ROLES.STUDENT);
            activeContext = {
                role: ROLES.STUDENT,
                schoolId: studentRole?.schoolId || null,
            };
            if (
                user.activeContext?.role !== ROLES.STUDENT
                || String(user.activeContext?.schoolId || '') !== String(activeContext.schoolId || '')
            ) {
                user.activeContext = activeContext;
                await user.save();
            }
        }

        const permissions = getEffectivePermissions(roleNames);

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            activeContext,
            roles,
            permissions,
        };
    }

    async getActiveRoles(userId) {
        return UserRole.find({ userId, status: 'active' }).lean();
    }
}

module.exports = new AuthService();
