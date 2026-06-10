const request = require('supertest');
const createApp = require('../../src/app');

describe('Health API', () => {
    const app = createApp();

    it('GET / returns API info', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('GET /api/v1/health returns healthy status', async () => {
        const res = await request(app).get('/api/v1/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/healthy/i);
    });

    it('GET unknown route returns 404', async () => {
        const res = await request(app).get('/api/v1/unknown-route');
        expect(res.status).toBe(404);
    });
});
