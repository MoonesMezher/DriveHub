const { Router } = require('express');
const {
    register,
    login,
    logout,
    refresh,
    getMe,
    getContexts,
    switchContext,
    forgotPassword,
    verifyResetCode,
    resetPassword,
} = require('../../controllers/auth.controller');
const {
    registerRules,
    loginRules,
    refreshRules,
    switchContextRules,
    logoutRules,
    forgotPasswordRules,
    verifyResetCodeRules,
    resetPasswordRules,
} = require('../../validators/auth.validator');
const handleValidationErrors = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');

const router = Router();

router.post('/register', registerRules, handleValidationErrors, register);
router.post('/login', loginRules, handleValidationErrors, login);
router.post('/refresh', refreshRules, handleValidationErrors, refresh);
router.post('/forgot-password', forgotPasswordRules, handleValidationErrors, forgotPassword);
router.post('/verify-reset-code', verifyResetCodeRules, handleValidationErrors, verifyResetCode);
router.post('/reset-password', resetPasswordRules, handleValidationErrors, resetPassword);
router.post('/logout', auth, logoutRules, handleValidationErrors, logout);
router.get('/me', auth, getMe);
router.get('/contexts', auth, getContexts);
router.post('/switch-context', auth, switchContextRules, handleValidationErrors, switchContext);

module.exports = router;
