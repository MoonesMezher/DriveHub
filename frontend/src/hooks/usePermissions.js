import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  hasPermission,
  hasAnyPermission,
  normalizePermissions,
  getPermissionsForRoles,
} from '@/lib/auth/rolePermissions'
import { getUserRoles } from '@/lib/auth/authUtils'

export const usePermissions = () => {
  const { user, permissions: authPermissions } = useAuth()

  const permissions = useMemo(() => {
    const fromAuth = normalizePermissions(authPermissions)
    if (fromAuth.length) return fromAuth

    const fromUser = normalizePermissions(user?.permissions)
    if (fromUser.length) return fromUser

    return getPermissionsForRoles(getUserRoles(user))
  }, [authPermissions, user])

  return useMemo(
    () => ({
      permissions,
      can: (permission) => hasPermission(permissions, permission),
      canAny: (perms) => hasAnyPermission(permissions, perms),
    }),
    [permissions],
  )
}
