const cors = require('cors');
const config = require('./index');

const corsOptions = {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);
