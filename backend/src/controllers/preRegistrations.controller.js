const { makeHandler } = require('../utils/controllerFactory');
const { preRegistrationService } = require('../services');

module.exports = {
    create: makeHandler((req) => preRegistrationService.create(req._user.userId, req.body), { status: 201, wrap: (d) => ({ preRegistration: d }) }),
    listMine: makeHandler((req) => preRegistrationService.listMine(req._user.userId), { wrap: (d) => ({ items: d }) }),
    cancel: makeHandler((req) => preRegistrationService.cancel(req.params.id, req._user.userId)),
};
