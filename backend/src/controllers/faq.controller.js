const { makeHandler } = require('../utils/controllerFactory');
const faqService = require('../services/faq.service');

module.exports = {
    listPublic: makeHandler(() => faqService.listPublic(), { wrap: (d) => ({ items: d }) }),
};
