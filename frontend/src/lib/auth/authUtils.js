import { ROLES } from '@/lib/constants/roles'
import { hasAnyPermission, hasPermission } from './rolePermissions'
import { getHomeRouteForRole } from './routeAccess'

export const getUserRoles = (user) => {
  const assigned = user?.roles?.map((r) => r.role) || []
  const active = user?.activeContext?.role
  return [...new Set([active, ...assigned].filter(Boolean))]
}

/** After wallet payment STUDENT exists but activeContext may still be REGISTERED. */
export const resolveEffectiveActiveRole = (user) => {
  const active = user?.activeContext?.role || ROLES.GUEST
  const assigned = user?.roles?.map((r) => r.role) || []
  if (active === ROLES.REGISTERED && assigned.includes(ROLES.STUDENT)) {
    return ROLES.STUDENT
  }
  return active
}

export const healPaidStudentSession = (user) => {
  if (!user) return user
  const effective = resolveEffectiveActiveRole(user)
  if (effective === user.activeContext?.role) return user
  const studentRole = user.roles?.find((r) => r.role === ROLES.STUDENT)
  return {
    ...user,
    activeContext: {
      role: effective,
      schoolId: studentRole?.schoolId || user.activeContext?.schoolId || null,
    },
  }
}

export const userHasRole = (user, ...roles) => {
  const all = getUserRoles(user)
  return roles.some((r) => all.includes(r))
}

export const userHasActiveRole = (user, ...roles) =>
  roles.includes(resolveEffectiveActiveRole(user))

export const canAccessRoute = (user, accessRule) => {
  if (!accessRule) return true
  if (accessRule.public) return true
  if (!user) return false

  const permissions = user.permissions || []
  const activeRole = resolveEffectiveActiveRole(user)

  if (accessRule.roles?.length && !accessRule.roles.includes(activeRole)) {
    return false
  }

  if (accessRule.permissions?.length && !hasAll(user, accessRule.permissions, permissions)) {
    return false
  }

  if (accessRule.anyPermission?.length && !hasAnyPermission(permissions, accessRule.anyPermission)) {
    return false
  }

  return true
}

const hasAll = (user, required, permissions) => {
  if (user?.activeContext?.role === ROLES.ADMIN) return true
  return required.every((p) => hasPermission(permissions, p))
}

export const resolvePostLoginRoute = (user, fallback = '/') => {
  if (!user) return fallback
  return getHomeRouteForRole(resolveEffectiveActiveRole(user)) || fallback
}

export const buildContextOptions = (user) => {
  if (!user?.roles?.length) return []
  return user.roles.map((r) => ({
    role: r.role,
    schoolId: r.schoolId,
    key: `${r.role}-${r.schoolId || 'global'}`,
  }))
}
