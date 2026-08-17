const passThrough = (req, res, next) => next()

// Rate limiting is disabled — all limiters are no-ops.
const apiLimiter = passThrough
const refreshLimiter = passThrough
const forgotPasswordLimiter = passThrough
const verifyResetCodeLimiter = passThrough

module.exports = {
    apiLimiter,
    refreshLimiter,
    forgotPasswordLimiter,
    verifyResetCodeLimiter,
}
