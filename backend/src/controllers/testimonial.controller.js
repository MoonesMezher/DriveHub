const { makeHandler } = require('../utils/controllerFactory');
const testimonialService = require('../services/testimonial.service');

module.exports = {
    listPublic: makeHandler(() => testimonialService.listPublic(), { wrap: (d) => ({ items: d }) }),
};
