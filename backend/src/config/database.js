const mongoose = require('mongoose');
const config = require('./index');

const connectDatabase = async () => {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUrl);
    return mongoose.connection;
};

const disconnectDatabase = async () => {
    await mongoose.disconnect();
};

module.exports = { connectDatabase, disconnectDatabase };
