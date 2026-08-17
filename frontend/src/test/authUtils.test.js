import { describe, it, expect } from 'vitest'
import { ROLES } from '@/lib/constants/roles'
import { PERMISSIONS } from '@/lib/auth/permissions'
import {
  userHasRole,
  canAccessRoute,
  resolvePostLoginRoute,
  resolveEffectiveActiveRole,
  healPaidStudentSession,
} from '@/lib/auth/authUtils'

describe('authUtils', () => {
  const studentUser = {
    activeContext: { role: ROLES.STUDENT },
    roles: [{ role: ROLES.STUDENT }],
    permissions: [PERMISSIONS.ACCESS_STUDENT_PORTAL, PERMISSIONS.LEARN_CONTENT],
  }

  const stalePaidUser = {
    activeContext: { role: ROLES.REGISTERED },
    roles: [
      { role: ROLES.REGISTERED },
      { role: ROLES.STUDENT, schoolId: 'school-1' },
    ],
    permissions: [PERMISSIONS.ACCESS_STUDENT_PORTAL, PERMISSIONS.LEARN_CONTENT],
  }

  it('userHasRole checks assigned roles', () => {
    expect(userHasRole(studentUser, ROLES.STUDENT)).toBe(true)
    expect(userHasRole(studentUser, ROLES.ADMIN)).toBe(false)
  })

  it('heals stale REGISTERED context after payment to STUDENT', () => {
    expect(resolveEffectiveActiveRole(stalePaidUser)).toBe(ROLES.STUDENT)
    const healed = healPaidStudentSession(stalePaidUser)
    expect(healed.activeContext.role).toBe(ROLES.STUDENT)
    expect(healed.activeContext.schoolId).toBe('school-1')
  })

  it('canAccessRoute allows student portal for paid user with stale REGISTERED context', () => {
    expect(
      canAccessRoute(stalePaidUser, {
        roles: [ROLES.STUDENT],
        permissions: [PERMISSIONS.ACCESS_STUDENT_PORTAL],
      }),
    ).toBe(true)
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
    expect(resolvePostLoginRoute(healPaidStudentSession(stalePaidUser))).toBe('/student')
  })
})
