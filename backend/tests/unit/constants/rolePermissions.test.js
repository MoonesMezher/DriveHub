const { ROLES } = require('../../../src/constants/roles');
const { PERMISSIONS } = require('../../../src/constants/permissions');
const {
    roleHasPermission,
    getEffectivePermissions,
    LOGIN_PORTALS,
} = require('../../../src/constants/rolePermissions');

describe('rolePermissions', () => {
    it('guest cannot access student portal permission', () => {
        expect(roleHasPermission(ROLES.GUEST, PERMISSIONS.ACCESS_STUDENT_PORTAL)).toBe(false);
    });

    it('student has student portal permission', () => {
        expect(roleHasPermission(ROLES.STUDENT, PERMISSIONS.ACCESS_STUDENT_PORTAL)).toBe(true);
    });

    it('admin has all permissions via effective set', () => {
        const perms = getEffectivePermissions([ROLES.ADMIN]);
        expect(perms).toContain(PERMISSIONS.MANAGE_PLATFORM_PRICING);
    });

    it('merges permissions from multiple roles', () => {
        const perms = getEffectivePermissions([ROLES.COACH, ROLES.STUDENT]);
        expect(perms).toContain(PERMISSIONS.ACCESS_COACH_PORTAL);
        expect(perms).toContain(PERMISSIONS.ACCESS_STUDENT_PORTAL);
    });

    it('defines login portals', () => {
        expect(LOGIN_PORTALS.student).toContain(ROLES.STUDENT);
        expect(LOGIN_PORTALS.school).toContain(ROLES.MANAGER);
        expect(LOGIN_PORTALS.admin).toContain(ROLES.ADMIN);
    });
});
