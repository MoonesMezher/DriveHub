import { Outlet } from 'react-router-dom'
import { Sidebar, DashboardHeader, RoleSwitcher, SiteFooter } from '@/components/layout'
import { useAuth } from '@/hooks/useAuth'
import { SIDEBAR_BY_ROLE } from '@/lib/design/navigation'
import { ROUTES } from '@/lib/constants/routes'

export const DashboardLayout = () => {
  const { activeRole, logout } = useAuth()
  const config = SIDEBAR_BY_ROLE[activeRole] || {
    subtitle: 'لوحة التحكم',
    items: [{ to: ROUTES.DASHBOARD, label: 'الرئيسية', icon: 'dashboard' }],
  }

  const sharedFooter = [
    { to: ROUTES.PROFILE, label: 'الملف الشخصي', icon: 'person' },
    { to: ROUTES.ENROLL, label: 'اشتراكي', icon: 'school' },
    { to: ROUTES.NOTIFICATIONS, label: 'الإشعارات', icon: 'notifications' },
    { icon: 'logout', label: 'تسجيل الخروج', onClick: () => logout() },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <div className="flex flex-1">
        <Sidebar
          subtitle={config.subtitle}
          items={config.items}
          variant={config.variant}
          cta={config.cta}
          footerItems={sharedFooter}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardHeader />
          <main className="dashboard-main flex-1">
            <div className="mb-comfortable">
              <RoleSwitcher />
            </div>
            <Outlet />
          </main>
          <SiteFooter compact />
        </div>
      </div>
    </div>
  )
}
