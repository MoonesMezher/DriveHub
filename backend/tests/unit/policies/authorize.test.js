const { requireRole, requirePermission } = require('../../../src/policies/authorize');
const { ROLES } = require('../../../src/constants/roles');
const { PERMISSIONS } = require('../../../src/constants/permissions');

const runMiddleware = (middleware, req) =>
    new Promise((resolve, reject) => {
        middleware(req, {}, (err) => (err ? reject(err) : resolve()));
    });

describe('authorize policies', () => {
    it('requireRole passes when user has active role', async () => {
        const req = { _user: { role: ROLES.ADMIN, roles: [] } };
        await expect(runMiddleware(requireRole(ROLES.ADMIN), req)).resolves.toBeUndefined();
    });

    it('requireRole fails for wrong role', async () => {
        const req = { _user: { role: ROLES.STUDENT, roles: [] } };
        await expect(runMiddleware(requireRole(ROLES.ADMIN), req)).rejects.toMatchObject({
            statusCode: 403,
        });
    });

    it('requirePermission passes when permission in token', async () => {
        const req = {
            _user: {
                role: ROLES.STUDENT,
                permissions: [PERMISSIONS.ACCESS_STUDENT_PORTAL],
            },
        };
        await expect(
            runMiddleware(requirePermission(PERMISSIONS.ACCESS_STUDENT_PORTAL), req),
        ).resolves.toBeUndefined();
    });
});
