const { parsePagination } = require('../utils/pagination');

const attachPagination = (req, res, next) => {
    req.pagination = parsePagination(req.query);
    next();
};

module.exports = attachPagination;
