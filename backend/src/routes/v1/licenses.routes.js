const { Router } = require('express');
const { list, getByCode } = require('../../controllers/licenses.controller');

const router = Router();

router.get('/', list);
router.get('/:code', getByCode);

module.exports = router;
