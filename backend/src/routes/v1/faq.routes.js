const { Router } = require('express');
const faqController = require('../../controllers/faq.controller');

const router = Router();

router.get('/', faqController.listPublic);

module.exports = router;
