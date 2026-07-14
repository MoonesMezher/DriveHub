const {
    normalizePrerequisite,
    normalizePrerequisites,
    extractLicenseCodes,
} = require('../../../src/helpers/licensePrerequisite.helper');

describe('licensePrerequisite.helper', () => {
    it('normalizes legacy string prerequisites', () => {
        const item = normalizePrerequisite('B');
        expect(item).toEqual({
            label: 'رخصة B مسبقاً',
            code: 'B',
            isRequired: true,
            type: 'license',
        });
    });

    it('normalizes structured prerequisites', () => {
        const items = normalizePrerequisites([
            { label: 'تقرير طبي', type: 'medical', isRequired: true },
        ]);
        expect(items[0].type).toBe('medical');
        expect(items[0].label).toBe('تقرير طبي');
    });

    it('extracts license codes only', () => {
        const codes = extractLicenseCodes([
            'B',
            { label: 'تقرير طبي', type: 'medical' },
            { label: 'رخصة C', code: 'C', type: 'license' },
        ]);
        expect(codes).toEqual(['B', 'C']);
    });

    it('normalizes lowercase license code in structured prerequisite', () => {
        const item = normalizePrerequisite({
            label: 'امتلاك رخصة d1 لمدة سنتين',
            code: 'd1',
            type: 'license',
            isRequired: true,
        });
        expect(item).toEqual({
            label: 'امتلاك رخصة d1 لمدة سنتين',
            code: 'D1',
            isRequired: true,
            type: 'license',
        });
    });
});
