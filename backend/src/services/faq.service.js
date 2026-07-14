const { FaqItem } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

class FaqService {
    async listPublic() {
        return FaqItem.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    }

    async listAdmin() {
        return FaqItem.find().sort({ order: 1, createdAt: 1 }).lean();
    }

    async create(data, adminId) {
        return FaqItem.create({ ...data, updatedBy: adminId });
    }

    async update(id, data, adminId) {
        const item = await FaqItem.findByIdAndUpdate(
            id,
            { ...data, updatedBy: adminId },
            { new: true, runValidators: true },
        );
        if (!item) throw new ApiError(404, ERR.NOT_FOUND);
        return item;
    }

    async delete(id) {
        const item = await FaqItem.findByIdAndDelete(id);
        if (!item) throw new ApiError(404, ERR.NOT_FOUND);
        return item;
    }
}

module.exports = new FaqService();
