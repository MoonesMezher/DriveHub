const { Router } = require('express');
const requirementController = require('../../controllers/requirement.controller');

const router = Router();

router.get('/', requirementController.listPublic);

module.exports = router;
