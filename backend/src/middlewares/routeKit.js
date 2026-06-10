/**
 * حزمة middlewares موحّدة لربط الـ routes بسرعة واتساق.
 */
const auth = require('./auth');
const optionalAuth = require('./optionalAuth');
const handleValidationErrors = require('./validate');
const id = require('./id');
const schoolScope = require('./schoolScope');
const attachPagination = require('./pagination');
const audit = require('./audit');
const { mongoIdParam } = require('../validators/common.validator');
const { requirePermission, requireRole, requireAnyPermission } = require('../policies/authorize');
const { hasRole } = require('../policies/canAccess');

const validate = handleValidationErrors;

/** تحقق من MongoId في params ثم middleware id */
const idParam = (name = 'id', label = 'المعرّف') => [
    mongoIdParam(name, label),
    validate,
    id,
];

module.exports = {
    auth,
    optionalAuth,
    validate,
    id,
    schoolScope,
    attachPagination,
    audit,
    idParam,
    mongoIdParam,
    requirePermission,
    requireRole,
    requireAnyPermission,
    hasRole,
};
