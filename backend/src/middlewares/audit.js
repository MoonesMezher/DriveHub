const auditService = require('../services/audit.service');

/**
 * Logs action after response completes.
 * Usage: audit('enrollment.accept')
 */
const audit = (action) => (req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode >= 400) return;
        auditService.log({
            action,
            userId: req._user?.userId,
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
        }).catch(() => {});
    });
    next();
};

module.exports = audit;
