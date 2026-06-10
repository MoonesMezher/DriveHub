const { haversineDistanceKm } = require('../../../src/utils/geolocation');

describe('geolocation', () => {
    it('returns 0 for identical coordinates', () => {
        expect(haversineDistanceKm(33.5, 36.3, 33.5, 36.3)).toBeCloseTo(0, 5);
    });

    it('calculates distance between two known points', () => {
        // Damascus ~33.5138, 36.2765 to Aleppo ~36.2021, 37.1343 ≈ 310km
        const distance = haversineDistanceKm(33.5138, 36.2765, 36.2021, 37.1343);
        expect(distance).toBeGreaterThan(250);
        expect(distance).toBeLessThan(400);
    });
});
