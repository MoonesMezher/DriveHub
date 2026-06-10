const { body, query } = require('express-validator');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const msg = require('./messages');
const { mongoIdBody, requiredString, optionalString, paginationQuery } = require('./chains');

const sendNotificationRules = [
    mongoIdBody('userId', 'المستخدم'),
    body('type')
        .notEmpty()
        .withMessage(msg.required('نوع الإشعار'))
        .isIn(Object.values(NOTIFICATION_TYPES))
        .withMessage(msg.mustBeIn('نوع الإشعار', Object.values(NOTIFICATION_TYPES))),
    requiredString('title', 'عنوان الإشعار', { min: 2, max: 200 }),
    requiredString('message', 'نص الإشعار', { min: 2, max: 1000 }),
    optionalString('body', 'محتوى الإشعار', { max: 2000 }),
    body('suggestions').optional().isArray({ max: 5 }).withMessage('الاقتراحات يجب ألا تتجاوز 5 عناصر'),
    body('data').optional().isObject().withMessage('بيانات الإشعار غير صالحة'),
];

const listNotificationsQuery = [
    query('unreadOnly').optional().isIn(['true', 'false']).withMessage('unreadOnly يجب أن يكون true أو false'),
    ...paginationQuery,
];

const markReadRules = [
    mongoIdBody('notificationId', 'الإشعار'),
];

module.exports = {
    sendNotificationRules,
    listNotificationsQuery,
    markReadRules,
};
