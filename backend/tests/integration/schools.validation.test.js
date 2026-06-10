const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const createApp = require('../../src/app');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Schools validation API', () => {
    it('GET /schools/nearby returns 400 without coordinates', async () => {
        const res = await request(app).get('/api/v1/schools/nearby');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
        expect(res.body.message).toMatch(/خط العرض|خط الطول|مطلوب/);
    });

    it('GET /schools/nearby returns 400 for invalid lat', async () => {
        const res = await request(app).get('/api/v1/schools/nearby?lat=999&lng=36');
        expect(res.status).toBe(400);
        expect(res.body.errors.some((e) => e.field === 'lat')).toBe(true);
    });

    it('GET /schools/:id returns 400 for invalid mongo id', async () => {
        const res = await request(app).get('/api/v1/schools/not-a-valid-id');
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/معرّف|غير صالح/);
    });
});
