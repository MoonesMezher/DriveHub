import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, SiteFooter, RoleSwitcher } from '@/components/layout'
import { DashboardHeaderWithDrawer } from '@/components/layout/DashboardHeader'
import { ConfirmDialog } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { SIDEBAR_BY_ROLE } from '@/lib/design/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { ROLES } from '@/lib/constants/roles'

const buildSharedFooter = (activeRole, onLogoutClick) => {
  const items = [
    { to: ROUTES.PROFILE, label: 'الملف الشخصي', icon: 'person' },
    { to: ROUTES.NOTIFICATIONS, label: 'الإشعارات', icon: 'notifications' },
    { icon: 'logout', label: 'تسجيل الخروج', onClick: onLogoutClick },
  ]

  if (activeRole !== ROLES.TRAFFIC && activeRole !== ROLES.MANAGER && activeRole !== ROLES.COACH) {
    items.splice(1, 0, { to: ROUTES.ENROLL, label: 'اشتراكي', icon: 'school' })
  }

  return items
}

export const DashboardLayout = () => {
  const { activeRole, logout } = useAuth()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const config = SIDEBAR_BY_ROLE[activeRole] || {
    subtitle: 'لوحة التحكم',
    items: [{ to: ROUTES.DASHBOARD, label: 'الرئيسية', icon: 'dashboard' }],
  }

  const footerItems = buildSharedFooter(activeRole, () => setLogoutConfirmOpen(true))

  const sidebarProps = {
    subtitle: config.subtitle,
    items: config.items,
    variant: config.variant,
    cta: config.cta,
    footerItems,
  }

  const handleLogoutConfirm = async () => {
    setLogoutConfirmOpen(false)
    await logout()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <div className="flex flex-1">
        <Sidebar {...sidebarProps} />
        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardHeaderWithDrawer
            sidebar={<Sidebar {...sidebarProps} mobile />}
          />
          <main className="dashboard-main flex-1">
            <div className="mb-comfortable">
              <RoleSwitcher />
            </div>
            <Outlet />
          </main>
          <SiteFooter variant="compact" />
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="تسجيل الخروج"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟"
        confirmLabel="تسجيل الخروج"
        cancelLabel="إلغاء"
        variant="primary"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  )
}
