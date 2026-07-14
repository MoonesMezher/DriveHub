const { Testimonial } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { toMediaPath } = require('../utils/mediaRef');

class TestimonialService {
    async listPublic() {
        return Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    }

    async listAdmin() {
        return Testimonial.find().sort({ order: 1, createdAt: 1 }).lean();
    }

    async create(data, adminId) {
        const payload = { ...data };
        if (payload.avatar !== undefined) {
            payload.avatar = toMediaPath(payload.avatar) || payload.avatar || '';
        }
        return Testimonial.create({ ...payload, updatedBy: adminId });
    }

    async update(id, data, adminId) {
        const payload = { ...data };
        if (payload.avatar !== undefined) {
            payload.avatar = toMediaPath(payload.avatar) || payload.avatar || '';
        }
        const item = await Testimonial.findByIdAndUpdate(
            id,
            { ...payload, updatedBy: adminId },
            { new: true, runValidators: true },
        );
        if (!item) throw new ApiError(404, ERR.NOT_FOUND);
        return item;
    }

    async delete(id) {
        const item = await Testimonial.findByIdAndDelete(id);
        if (!item) throw new ApiError(404, ERR.NOT_FOUND);
        return item;
    }
}

module.exports = new TestimonialService();
