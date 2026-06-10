const asyncHandler = require('../utils/asyncHandler');
const { authService } = require('../services');

const getMeta = (req) => ({
    userAgent: req.headers['user-agent'] || null,
});

const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, getMeta(req));
    res.status(200).json({ success: true, data: result });
});

const logout = asyncHandler(async (req, res) => {
    await authService.logout({
        refreshToken: req.body.refreshToken,
        userId: req._user.userId,
    });
    res.status(200).json({ success: true, message: 'Logged out' });
});

const refresh = asyncHandler(async (req, res) => {
    const result = await authService.refreshSession(req.body.refreshToken, getMeta(req));
    res.status(200).json({ success: true, data: result });
});

const getMe = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req._user.userId);
    res.status(200).json({ success: true, data: { user } });
});

const getContexts = asyncHandler(async (req, res) => {
    const contexts = await authService.getContexts(req._user.userId);
    res.status(200).json({ success: true, data: { contexts } });
});

const switchContext = asyncHandler(async (req, res) => {
    const result = await authService.switchContext(req._user.userId, req.body);
    res.status(200).json({ success: true, data: result });
});

module.exports = {
    register,
    login,
    logout,
    refresh,
    getMe,
    getContexts,
    switchContext,
};
