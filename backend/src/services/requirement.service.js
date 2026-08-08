const { RequirementItem } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { REQUIREMENT_SECTION_VALUES } = require('../constants/requirementSections');

class RequirementService {
    async listPublic(section) {
        const filter = { isActive: true };
        if (section && REQUIREMENT_SECTION_VALUES.includes(section)) {
            filter.section = section;
        }
        return RequirementItem.find(filter).sort({ section: 1, order: 1, createdAt: 1 }).lean();
    }

    async listAdmin(section) {
        const filter = {};
        if (section && REQUIREMENT_SECTION_VALUES.includes(section)) {
            filter.section = section;
        }
        return RequirementItem.find(filter).sort({ section: 1, order: 1, createdAt: 1 }).lean();
    }

    async create(data, adminId) {
        return RequirementItem.create({ ...data, updatedBy: adminId });
    }

    async update(id, data, adminId) {
        const item = await RequirementItem.findByIdAndUpdate(
            id,
            { ...data, updatedBy: adminId },
            { new: true, runValidators: true },
        );
        if (!item) throw new ApiError(404, ERR.NOT_FOUND);
        return item;
    }

    async delete(id) {
        const item = await RequirementItem.findByIdAndDelete(id);
        if (!item) throw new ApiError(404, ERR.NOT_FOUND);
        return item;
    }
}

module.exports = new RequirementService();
