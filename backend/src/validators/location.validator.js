const { body, query } = require('express-validator');
const msg = require('./messages');
const { queryLat, queryLng, requiredLat, requiredLng, paginationQuery } = require('./chains');

const saveLocationRules = [
    requiredLat('lat'),
    requiredLng('lng'),
    body('source')
        .optional()
        .isIn(['gps', 'manual', 'ip'])
        .withMessage(msg.mustBeIn('مصدر الموقع', ['gps', 'manual', 'ip'])),
    body('governorate').optional().trim().isLength({ max: 100 }).withMessage('اسم المحافظة طويل جداً'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('دقة الموقع غير صالحة'),
];

const nearbySchoolsQuery = [
    queryLat(),
    queryLng(),
    query('category').optional().trim().isLength({ min: 1, max: 3 }).withMessage('فئة الرخصة غير صالحة'),
    query('femaleCoach').optional().isIn(['true', 'false']).withMessage('قيمة femaleCoach يجب أن تكون true أو false'),
    ...paginationQuery,
];

module.exports = {
    saveLocationRules,
    nearbySchoolsQuery,
};
