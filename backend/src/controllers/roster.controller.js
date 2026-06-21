const { makeHandler } = require('../utils/controllerFactory');
const { rosterService } = require('../services');

module.exports = {
    verify: makeHandler(
        (req) => rosterService.verifyByToken(req.params.token, {
            ip: req.ip,
            userAgent: req.get('user-agent'),
        }),
        { wrap: (d) => ({ verification: d }) },
    ),
};
