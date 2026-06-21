const { Router } = require('express');
const { globalSearch } = require('../../controllers/search.controller');
const { searchQueryRules } = require('../../validators/search.validator');
const { auth, validate } = require('../../middlewares/routeKit');

const router = Router();

router.get('/', auth, searchQueryRules, validate, globalSearch);

module.exports = router;
