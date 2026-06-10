const { Router } = require('express');
const {
    register,
    login,
    logout,
    refresh,
    getMe,
    getContexts,
    switchContext,
} = require('../../controllers/auth.controller');
const {
    registerRules,
    loginRules,
    refreshRules,
    switchContextRules,
    logoutRules,
} = require('../../validators/auth.validator');
const handleValidationErrors = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { loginLimiter, refreshLimiter } = require('../../middlewares/limiter');

const router = Router();

router.post('/register', registerRules, handleValidationErrors, register);
router.post('/login', loginLimiter, loginRules, handleValidationErrors, login);
router.post('/refresh', refreshLimiter, refreshRules, handleValidationErrors, refresh);
router.post('/logout', auth, logoutRules, handleValidationErrors, logout);
router.get('/me', auth, getMe);
router.get('/contexts', auth, getContexts);
router.post('/switch-context', auth, switchContextRules, handleValidationErrors, switchContext);

module.exports = router;
