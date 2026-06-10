const { Router } = require('express');
const { list, markRead, markAllRead } = require('../../controllers/notifications.controller');
const { listNotificationsQuery } = require('../../validators/notification.validator');
const handleValidationErrors = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { mongoIdParam } = require('../../validators/common.validator');
const id = require('../../middlewares/id');

const router = Router();

router.use(auth);

router.get('/', listNotificationsQuery, handleValidationErrors, list);
router.post('/read-all', markAllRead);
router.patch('/:id/read', mongoIdParam('id', 'الإشعار'), handleValidationErrors, id, markRead);

module.exports = router;
