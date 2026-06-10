import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, hasAnyPermission } from '@/lib/auth/rolePermissions'

export const usePermissions = () => {
  const { user } = useAuth()

  return useMemo(
    () => ({
      can: (permission) => hasPermission(user, permission),
      canAny: (permissions) => hasAnyPermission(user, permissions),
    }),
    [user],
  )
}
