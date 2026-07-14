const rateLimiter = require("express-rate-limit")

const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: {
        error: "Too many requests from this IP,please try again later"
    },
    standardHeaders: true,
})

const loginLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 60 min
    max: 5,
    message: {
        error: "Too many requests from this IP,please try again later"
    },
    standardHeaders: true,
})

const refreshLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many refresh attempts, please try again later' },
    standardHeaders: true,
})

const forgotPasswordLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'محاولات كثيرة لطلب إعادة تعيين كلمة المرور، حاول لاحقاً' },
    standardHeaders: true,
})

const verifyResetCodeLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'محاولات كثيرة للتحقق من الرمز، حاول لاحقاً' },
    standardHeaders: true,
})

module.exports = {
    apiLimiter,
    loginLimiter,
    refreshLimiter,
    forgotPasswordLimiter,
    verifyResetCodeLimiter,
}