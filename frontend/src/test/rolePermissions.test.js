import { describe, it, expect } from 'vitest'
import { ROLES } from '@/lib/constants/roles'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { getPermissionsForRoles, hasPermission, LOGIN_PORTALS } from '@/lib/auth/rolePermissions'

describe('rolePermissions', () => {
  it('registered user can submit enrollment', () => {
    const perms = getPermissionsForRoles([ROLES.REGISTERED])
    expect(hasPermission(perms, PERMISSIONS.SUBMIT_ENROLLMENT)).toBe(true)
  })

  it('guest cannot view full sample', () => {
    const perms = getPermissionsForRoles([ROLES.GUEST])
    expect(hasPermission(perms, PERMISSIONS.VIEW_SAMPLE_FULL)).toBe(false)
  })

  it('admin has compliance permissions', () => {
    const perms = getPermissionsForRoles([ROLES.ADMIN])
    expect(hasPermission(perms, PERMISSIONS.VIEW_COMPLIANCE)).toBe(true)
    expect(hasPermission(perms, PERMISSIONS.MANAGE_COMPLIANCE)).toBe(true)
  })

  it('hasPermission normalizes Set and user-like objects', () => {
    expect(hasPermission(new Set([PERMISSIONS.VIEW_COMPLIANCE]), PERMISSIONS.VIEW_COMPLIANCE)).toBe(true)
    expect(hasPermission({ permissions: [PERMISSIONS.MANAGE_COMPLIANCE] }, PERMISSIONS.MANAGE_COMPLIANCE)).toBe(true)
    expect(hasPermission(undefined, PERMISSIONS.VIEW_COMPLIANCE)).toBe(false)
    expect(hasPermission({}, PERMISSIONS.VIEW_COMPLIANCE)).toBe(false)
  })

  it('login portals map roles', () => {
    expect(LOGIN_PORTALS.school).toContain(ROLES.MANAGER)
  })
})
