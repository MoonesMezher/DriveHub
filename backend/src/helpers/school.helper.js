const { haversineDistanceKm } = require('../utils/geolocation');

const sortSchoolsByDistance = (schools, userLat, userLng) =>
    schools
        .map((school) => ({
            ...school,
            distanceKm: haversineDistanceKm(userLat, userLng, school.lat, school.lng),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);

const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)} م`;
    return `${km.toFixed(1)} كم`;
};

module.exports = { sortSchoolsByDistance, formatDistance };
