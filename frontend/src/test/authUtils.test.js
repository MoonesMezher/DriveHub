import { describe, it, expect } from 'vitest'
import { ROLES } from '@/lib/constants/roles'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { userHasRole, canAccessRoute, resolvePostLoginRoute } from '@/lib/auth/authUtils'

describe('authUtils', () => {
  const studentUser = {
    activeContext: { role: ROLES.STUDENT },
    roles: [{ role: ROLES.STUDENT }],
    permissions: [PERMISSIONS.ACCESS_STUDENT_PORTAL],
  }

  it('userHasRole checks assigned roles', () => {
    expect(userHasRole(studentUser, ROLES.STUDENT)).toBe(true)
    expect(userHasRole(studentUser, ROLES.ADMIN)).toBe(false)
  })

  it('canAccessRoute enforces role and permission', () => {
    expect(
      canAccessRoute(studentUser, {
        roles: [ROLES.STUDENT],
        permissions: [PERMISSIONS.ACCESS_STUDENT_PORTAL],
      }),
    ).toBe(true)

    expect(
      canAccessRoute(studentUser, {
        roles: [ROLES.ADMIN],
      }),
    ).toBe(false)
  })

  it('resolvePostLoginRoute returns role home', () => {
    expect(resolvePostLoginRoute(studentUser)).toBe('/student')
  })
})
