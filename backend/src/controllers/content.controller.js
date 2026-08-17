const { makeHandler } = require('../utils/controllerFactory');
const { contentService } = require('../services');
const { ROLES } = require('../constants/roles');

const getSample = makeHandler((req) => {
    const isGuest = !req._user?.userId || req._user?.role === ROLES.GUEST;
    const tier = isGuest ? 'partial' : 'full';
    const categoryCode = req.query.categoryCode || req.query.category || 'B';
    return contentService.getSample({ tier, categoryCode });
});

module.exports = { getSample };
