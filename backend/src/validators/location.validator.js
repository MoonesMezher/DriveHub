const { body, query } = require('express-validator');
const msg = require('./messages');
const { SYRIAN_GOVERNORATES } = require('../constants/syrianGovernorates');
const { queryLat, queryLng, requiredLat, requiredLng, paginationQuery } = require('./chains');

const saveLocationRules = [
    requiredLat('lat'),
    requiredLng('lng'),
    body('source')
        .optional()
        .isIn(['gps', 'manual', 'ip'])
        .withMessage(msg.mustBeIn('مصدر الموقع', ['gps', 'manual', 'ip'])),
    body('governorate')
        .optional({ values: 'falsy' })
        .trim()
        .isIn(SYRIAN_GOVERNORATES)
        .withMessage('المحافظة غير صالحة'),
    body('accuracy').optional().isFloat({ min: 0 }).withMessage('دقة الموقع غير صالحة'),
];

const mapSchoolsQuery = [
    query('lat').optional().isFloat({ min: -90, max: 90 }).withMessage(msg.latInvalid),
    query('lng').optional().isFloat({ min: -180, max: 180 }).withMessage(msg.lngInvalid),
    query('category').optional().trim().isLength({ min: 1, max: 3 }).withMessage('فئة الرخصة غير صالحة'),
    query('femaleCoach').optional().isIn(['true', 'false']).withMessage('قيمة femaleCoach يجب أن تكون true أو false'),
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
    mapSchoolsQuery,
    nearbySchoolsQuery,
};
