const config = require('../config');

const format = (level, message, meta = {}) => ({
    level,
    message,
    timestamp: new Date().toISOString(),
    env: config.env,
    ...meta,
});

const log = (level, message, meta) => {
    const entry = format(level, message, meta);
    if (config.env === 'test') return;
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
};

module.exports = {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    debug: (message, meta) => {
        if (config.env === 'development') log('debug', message, meta);
    },
};
