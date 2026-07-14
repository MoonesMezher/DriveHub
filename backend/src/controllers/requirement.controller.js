const { makeHandler } = require('../utils/controllerFactory');
const requirementService = require('../services/requirement.service');

module.exports = {
    listPublic: makeHandler(() => requirementService.listPublic(), { wrap: (d) => ({ items: d }) }),
};
