const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('./config');
const corsMiddleware = require('./config/cors');
const v1Routes = require('./routes/v1');
const httpsRedirect = require('./middlewares/httpsRedirect');
const {
    xssSanitize,
    mongoSanitize,
    requestId,
    apiLimiter,
    notFound,
    errorHandler,
    upload,
} = require('./middlewares');
const { handleImageUploadError } = require('./middlewares/imageUpload');

const createApp = () => {
    const app = express();

    app.set('trust proxy', 1);
    app.use(httpsRedirect);
    app.use(helmet(config.env === 'production' ? {
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    } : {}));
    app.use(compression());
    app.use(corsMiddleware);
    app.use(requestId);
    app.use(morgan(config.env === 'test' ? 'tiny' : 'dev'));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(mongoSanitize);
    app.use(xssSanitize);
    app.use(apiLimiter);

    // Multer error handler available via upload.handleUploadError in routes
    app.use(upload.handleUploadError);
    app.use(handleImageUploadError);

    app.get('/', (req, res) => {
        res.json({ success: true, message: 'DriveHub API', version: 'v1' });
    });

    app.use('/api/v1', v1Routes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
};

module.exports = createApp;