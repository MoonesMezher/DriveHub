import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/app/providers/AuthProvider'

export const GuestRoute = ({ redirectTo }) => {
  const { isAuthenticated, bootstrapping, getHomeRoute } = useAuthContext()

  if (bootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" dir="rtl">
        <p className="text-body-md text-on-surface-variant">جاري التحميل...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo || getHomeRoute()} replace />
  }

  return <Outlet />
}
