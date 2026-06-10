const { User, UserRole, RefreshToken } = require('../models');
const passwordService = require('../utils/passwordService');
const jwtService = require('../utils/jwtService');
const { hashToken } = require('../utils/tokenHash');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { ROLES } = require('../constants/roles');
const { LOGIN_PORTALS, getEffectivePermissions } = require('../constants/rolePermissions');
const { getDefaultRouteForRole } = require('../constants/portals');

class AuthService {
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
        const activeContext = {
            role: user.activeContext?.role || ROLES.REGISTERED,
            schoolId: user.activeContext?.schoolId || null,
        };
        const roleNames = roles.map((r) => r.role);
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
