/**
 * Express 5 compatible MongoDB operator sanitizer.
 * express-mongo-sanitize mutates req.query which is read-only in Express 5.
 */
const sanitizeValue = (value) => {
    if (value == null) return value;

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (typeof value === 'object') {
        const clean = {};
        Object.entries(value).forEach(([key, val]) => {
            if (key.startsWith('$') || key.includes('.')) return;
            clean[key] = sanitizeValue(val);
        });
        return clean;
    }

    return value;
};

const mongoSanitize = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeValue(req.params);
    }
    next();
};

module.exports = mongoSanitize;
