import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'

export const PermissionGate = ({ permission, permissions, children }) => {
  const { can, canAny, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  const required = permissions || (permission ? [permission] : [])
  if (required.length && !canAny(required)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return children
}
