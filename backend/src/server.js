const createApp = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/database');
const { registerJobs } = require('./jobs');
const { platformService } = require('./services');

const startServer = async() => {
    await connectDatabase();
    await platformService.loadCommissionFromStore();
    registerJobs();
    const app = createApp();

    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
};

startServer().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});