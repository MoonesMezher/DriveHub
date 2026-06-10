const { makeHandler } = require('../utils/controllerFactory');
const { reviewService } = require('../services');

module.exports = {
    create: makeHandler((req) => reviewService.create(req._user.userId, req.body), { status: 201, wrap: (d) => ({ review: d }) }),
    listBySchool: makeHandler((req) => reviewService.listBySchool(req.params.schoolId, req.query), { wrap: (d) => ({ reviews: d }) }),
};
