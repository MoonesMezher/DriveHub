const { makeHandler } = require('../utils/controllerFactory');
const verificationService = require('../services/verification.service');

module.exports = {
    verifyStatistics: makeHandler(
        (req) => verificationService.verifyStatistics(req.params.token, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }),
        { wrap: (d) => ({ verification: d }) },
    ),
    verifyCertificate: makeHandler(
        (req) => verificationService.verifyCertificate(req.params.token, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }),
        { wrap: (d) => ({ verification: d }) },
    ),
    verifyRoster: makeHandler(
        (req) => verificationService.verifyRoster(req.params.token, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }),
        { wrap: (d) => ({ verification: d }) },
    ),
};
