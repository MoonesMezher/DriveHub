const { LicenseCategory, LicenseSubType } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const FALLBACK_LICENSES = [
    { code: 'B', name: 'خصوصي', minAge: 18, subTypes: ['B1', 'B2'] },
    { code: 'C', name: 'عمومي صغير', minAge: 21, prerequisites: ['B'] },
    { code: 'A', name: 'دراجة نارية', minAge: 18 },
];

class LicenseService {
    async list() {
        const categories = await LicenseCategory.find({ isActive: true }).sort({ order: 1 }).lean();
        if (!categories.length) return FALLBACK_LICENSES;

        const subTypes = await LicenseSubType.find({ isActive: true }).lean();
        const subByParent = subTypes.reduce((acc, st) => {
            acc[st.parentCode] = acc[st.parentCode] || [];
            acc[st.parentCode].push(st);
            return acc;
        }, {});

        return categories.map((cat) => ({
            ...cat,
            subTypes: (subByParent[cat.code] || []).map((s) => s.subCode),
            subTypeDetails: subByParent[cat.code] || [],
        }));
    }

    async getByCode(code) {
        const category = await LicenseCategory.findOne({
            code: code.toUpperCase(),
            isActive: true,
        }).lean();

        if (!category) {
            const fallback = FALLBACK_LICENSES.find((l) => l.code.toUpperCase() === code.toUpperCase());
            return fallback || null;
        }

        const subTypeDetails = await LicenseSubType.find({
            parentCode: category.code,
            isActive: true,
        }).lean();

        return { ...category, subTypeDetails };
    }

    async upsertCategory(data, adminId) {
        const code = data.code.toUpperCase();
        return LicenseCategory.findOneAndUpdate(
            { code },
            { ...data, code, updatedBy: adminId },
            { upsert: true, new: true, runValidators: true },
        );
    }

    async upsertSubType(data) {
        const parentCode = data.parentCode.toUpperCase();
        const subCode = data.subCode.toUpperCase();
        const parent = await LicenseCategory.findOne({ code: parentCode });
        if (!parent) throw new ApiError(400, ERR.LICENSE_PARENT_NOT_FOUND);

        return LicenseSubType.findOneAndUpdate(
            { parentCode, subCode },
            { ...data, parentCode, subCode },
            { upsert: true, new: true, runValidators: true },
        );
    }
}

module.exports = new LicenseService();
