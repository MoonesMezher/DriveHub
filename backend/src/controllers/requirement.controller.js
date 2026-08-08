const { makeHandler } = require('../utils/controllerFactory');
const requirementService = require('../services/requirement.service');

module.exports = {
    listPublic: makeHandler((req) => requirementService.listPublic(req.query.section), { wrap: (d) => ({ items: d }) }),
};
