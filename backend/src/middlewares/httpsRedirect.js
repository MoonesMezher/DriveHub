const config = require('../config');

/**
 * في الإنتاج: إعادة توجيه HTTP → HTTPS (عند وجود proxy يضبط x-forwarded-proto).
 * Helmet HSTS يُفعَّل في app.js مع createApp.
 */
const httpsRedirect = (req, res, next) => {
    if (config.env !== 'production') return next();

    const proto = req.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
        return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
    }

    return next();
};

module.exports = httpsRedirect;
