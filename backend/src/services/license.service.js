const { LicenseCategory, LicenseSubType } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const {
    normalizePrerequisites,
} = require('../helpers/licensePrerequisite.helper');

const FALLBACK_LICENSES = [
    {
        code: 'B',
        name: 'غير تجاري',
        briefDesc: 'غير تجاري — حتى 8 ركاب',
        fullDesc: 'رخصة غير تجارية مخصصة لقيادة السيارات الخاصة والكرافانات بعدد ركاب لا يتجاوز 8 ركاب.',
        requirementsIntro: 'متطلبات رخصة B (غير تجارية)',
        minAge: 18,
        vehicleTypes: 'سيارات خاصة وكرافان حتى 8 ركاب',
        subTypes: ['B1', 'B2'],
    },
    {
        code: 'C',
        name: 'فئة C',
        briefDesc: 'بعد B لثلاث سنوات',
        fullDesc: 'فئة C تتطلب امتلاك رخصة B لمدة 3 سنوات على الأقل، وتغطي مركبات حتى 10 ركاب أو حمولة حتى 4 أطنان.',
        requirementsIntro: 'متطلبات رخصة C',
        minAge: 21,
        prerequisites: normalizePrerequisites([
            { label: 'امتلاك رخصة B لمدة 3 سنوات', code: 'B', isRequired: true, type: 'license' },
        ]),
        vehicleTypes: 'مركبات حتى 10 ركاب أو حمولة حتى 4 أطنان',
    },
    {
        code: 'D1',
        name: 'فئة D1',
        briefDesc: 'بعد C لسنتين',
        fullDesc: 'فئة D1 تتطلب امتلاك رخصة C لمدة سنتين على الأقل، وتغطي مركبات حتى 24 راكباً أو حمولة حتى 11 طناً.',
        requirementsIntro: 'متطلبات رخصة D1',
        minAge: 23,
        prerequisites: normalizePrerequisites([
            { label: 'امتلاك رخصة C لمدة سنتين', code: 'C', isRequired: true, type: 'license' },
        ]),
        vehicleTypes: 'مركبات حتى 24 راكباً أو حمولة حتى 11 طناً',
    },
    {
        code: 'D2',
        name: 'فئة D2',
        briefDesc: 'باصات وشاحنات',
        fullDesc: 'فئة D2 تتطلب امتلاك رخصة D1 لمدة سنتين على الأقل، وتغطي قيادة الباصات والشاحنات.',
        requirementsIntro: 'متطلبات رخصة D2',
        minAge: 25,
        prerequisites: normalizePrerequisites([
            { label: 'امتلاك رخصة D1 لمدة سنتين', code: 'D1', isRequired: true, type: 'license' },
        ]),
        vehicleTypes: 'باصات وشاحنات',
    },
    {
        code: 'A',
        name: 'فئة A',
        briefDesc: 'دراجات نارية — فحص خاص',
        fullDesc: 'فئة A مخصصة للدراجات النارية وتتطلب اجتياز فحص خاص للدراجات النارية.',
        requirementsIntro: 'متطلبات رخصة A',
        minAge: 18,
        prerequisites: normalizePrerequisites([
            { label: 'اجتياز فحص خاص بالدراجات النارية', type: 'basic', isRequired: true },
        ]),
        vehicleTypes: 'دراجات نارية',
    },
    {
        code: 'H',
        name: 'فئة H',
        briefDesc: 'للأغراض المخصصة',
        fullDesc: 'فئة H مخصصة للأغراض الخاصة بقيادة الآليات الزراعية.',
        requirementsIntro: 'متطلبات رخصة H',
        minAge: 18,
        prerequisites: normalizePrerequisites([
            { label: 'ترخيص لغرض مخصص (آليات زراعية)', type: 'basic', isRequired: true },
        ]),
        vehicleTypes: 'الآليات الزراعية',
    },
    {
        code: 'W',
        name: 'فئة W',
        briefDesc: 'ذوو الاحتياجات الخاصة',
        fullDesc: 'فئة W مخصصة لقيادة مركبات ذوي الاحتياجات الخاصة وتتطلب تقريراً طبياً معتمداً.',
        requirementsIntro: 'متطلبات رخصة W',
        minAge: 18,
        prerequisites: normalizePrerequisites([
            { label: 'تقرير طبي معتمد', type: 'medical', isRequired: true },
        ]),
        vehicleTypes: 'مركبات ذوي الاحتياجات الخاصة',
    },
];

const normalizeCategory = (category) => ({
    ...category,
    prerequisites: normalizePrerequisites(category.prerequisites),
});

class LicenseService {
    async listAdmin() {
        const categories = await LicenseCategory.find().sort({ order: 1 }).lean();
        const subTypes = await LicenseSubType.find().lean();
        const subByParent = subTypes.reduce((acc, st) => {
            acc[st.parentCode] = acc[st.parentCode] || [];
            acc[st.parentCode].push(st);
            return acc;
        }, {});

        return categories.map((cat) => normalizeCategory({
            ...cat,
            subTypes: (subByParent[cat.code] || []).map((s) => s.subCode),
            subTypeDetails: subByParent[cat.code] || [],
        }));
    }

    async list() {
        const categories = await LicenseCategory.find({ isActive: true }).sort({ order: 1 }).lean();
        if (!categories.length) return FALLBACK_LICENSES;

        const subTypes = await LicenseSubType.find({ isActive: true }).lean();
        const subByParent = subTypes.reduce((acc, st) => {
            acc[st.parentCode] = acc[st.parentCode] || [];
            acc[st.parentCode].push(st);
            return acc;
        }, {});

        return categories.map((cat) => normalizeCategory({
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
            return fallback ? normalizeCategory(fallback) : null;
        }

        const subTypeDetails = await LicenseSubType.find({
            parentCode: category.code,
            isActive: true,
        }).lean();

        return normalizeCategory({ ...category, subTypeDetails });
    }

    async upsertCategory(data, adminId) {
        const code = data.code.toUpperCase();
        const payload = {
            ...data,
            code,
            prerequisites: normalizePrerequisites(data.prerequisites),
            updatedBy: adminId,
        };
        return LicenseCategory.findOneAndUpdate(
            { code },
            payload,
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
