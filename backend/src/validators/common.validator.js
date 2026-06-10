const {
    mongoIdParam: mongoIdParamChain,
    optionalMongoIdParam,
    paginationQuery,
} = require('./chains');

const mongoIdParam = (name, label) => mongoIdParamChain(name, label);

module.exports = {
    mongoIdParam,
    optionalMongoIdParam,
    paginationQuery,
};
