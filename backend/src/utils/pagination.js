const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (query = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
    let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
    limit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

const buildPaginationMeta = ({ page, limit, total }) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
});

module.exports = { parsePagination, buildPaginationMeta, DEFAULT_LIMIT, MAX_LIMIT };
