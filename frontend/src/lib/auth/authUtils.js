import { ROLES } from '@/lib/constants/roles'
import { hasAnyPermission, hasPermission } from './rolePermissions'
import { getHomeRouteForRole } from './routeAccess'

export const getUserRoles = (user) => {
  const assigned = user?.roles?.map((r) => r.role) || []
  const active = user?.activeContext?.role
  return [...new Set([active, ...assigned].filter(Boolean))]
}

export const userHasRole = (user, ...roles) => {
  const all = getUserRoles(user)
  return roles.some((r) => all.includes(r))
}

export const userHasActiveRole = (user, ...roles) =>
  roles.includes(user?.activeContext?.role)

export const canAccessRoute = (user, accessRule) => {
  if (!accessRule) return true
  if (accessRule.public) return true
  if (!user) return false

  const permissions = user.permissions || []
  const activeRole = user.activeContext?.role

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
  return getHomeRouteForRole(user.activeContext?.role) || fallback
}

export const buildContextOptions = (user) => {
  if (!user?.roles?.length) return []
  return user.roles.map((r) => ({
    role: r.role,
    schoolId: r.schoolId,
    key: `${r.role}-${r.schoolId || 'global'}`,
  }))
}
