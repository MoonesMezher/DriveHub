const { UserLocation } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

class LocationService {
    async save({ userId, lat, lng, source = 'gps', accuracy = null, governorate = null }) {
        return UserLocation.findOneAndUpdate(
            { userId },
            { userId, lat, lng, source, accuracy, governorate },
            { upsert: true, new: true },
        );
    }

    async getLatest(userId) {
        const loc = await UserLocation.findOne({ userId }).sort({ updatedAt: -1 });
        if (!loc) throw new ApiError(404, 'لم يتم حفظ موقع بعد');
        return loc;
    }
}

module.exports = new LocationService();
