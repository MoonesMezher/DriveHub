const { makeHandler } = require('../utils/controllerFactory');
const { schoolApplicationService } = require('../services');

module.exports = {
    submit: makeHandler((req) => schoolApplicationService.submit(req._user.userId, req.body), { status: 201, wrap: (d) => ({ application: d }) }),
    listMine: makeHandler((req) => schoolApplicationService.listMine(req._user.userId), { wrap: (d) => ({ applications: d }) }),
    getById: makeHandler((req) => schoolApplicationService.getById(req.params.id, req._user.userId), { wrap: (d) => ({ application: d }) }),
};
