const { makeHandler } = require('../utils/controllerFactory');
const settingsService = require('../services/settings.service');

const getPrivacy = makeHandler(() => settingsService.getPrivacy());

module.exports = { getPrivacy };
