const PREREQUISITE_TYPES = ['license', 'basic', 'medical'];

const TYPE_SUBTITLES = {
    license: 'متطلب أساسي',
    basic: 'متطلب أساسي',
    medical: 'متطلب طبي',
};

const defaultLabel = (item) => {
    if (item.type === 'medical') return 'تقرير طبي ساري';
    if (item.type === 'basic') return 'متطلب أساسي';
    if (item.code) return `رخصة ${item.code} مسبقاً`;
    return 'متطلب';
};

const normalizePrerequisite = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
        const code = item.trim().toUpperCase();
        if (!code) return null;
        return {
            label: `رخصة ${code} مسبقاً`,
            code,
            isRequired: true,
            type: 'license',
        };
    }
    if (typeof item !== 'object') return null;

    const type = PREREQUISITE_TYPES.includes(item.type) ? item.type : 'license';
    const code = item.code ? String(item.code).trim().toUpperCase() : '';
    const normalized = {
        label: String(item.label || '').trim() || defaultLabel({ type, code }),
        code,
        isRequired: item.isRequired !== false,
        type,
    };
    return normalized;
};

const normalizePrerequisites = (items = []) =>
    (Array.isArray(items) ? items : [])
        .map(normalizePrerequisite)
        .filter(Boolean);

const extractLicenseCodes = (items = []) =>
    normalizePrerequisites(items)
        .filter((item) => item.type === 'license' && item.code)
        .map((item) => item.code);

const formatPrerequisiteSummary = (items = []) => {
    const normalized = normalizePrerequisites(items);
    if (!normalized.length) return '';
    return normalized.map((item) => item.label).join('، ');
};

module.exports = {
    PREREQUISITE_TYPES,
    TYPE_SUBTITLES,
    normalizePrerequisite,
    normalizePrerequisites,
    extractLicenseCodes,
    formatPrerequisiteSummary,
};
