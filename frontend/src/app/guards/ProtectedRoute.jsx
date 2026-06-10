import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/lib/constants/routes'
import { matchRouteAccess } from '@/lib/auth/routeAccess'
import { canAccessRoute } from '@/lib/auth/authUtils'

export const ProtectedRoute = ({ allowedRoles, requiredPermissions, accessRule }) => {
  const { isAuthenticated, bootstrapping, user, activeRole } = useAuthContext()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" dir="rtl">
        <p className="text-body-md text-on-surface-variant">جاري التحقق من الجلسة...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  const rule = accessRule || matchRouteAccess(location.pathname) || {}

  const mergedRule = {
    ...rule,
    roles: allowedRoles || rule.roles,
    permissions: requiredPermissions || rule.permissions,
  }

  if (mergedRule.roles?.length && !mergedRule.roles.includes(activeRole)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  if (!canAccessRoute(user, mergedRule)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />
  }

  return <Outlet />
}
