const { makeHandler } = require('../utils/controllerFactory');
const platformService = require('../services/platform.service');

module.exports = {
    listActive: makeHandler(
        (req) => platformService.listAds(req.query.placement ? { placement: req.query.placement } : {}),
        { wrap: (d) => ({ ads: d }) },
    ),
};
