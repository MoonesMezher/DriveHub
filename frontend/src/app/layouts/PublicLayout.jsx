import { Outlet, useLocation } from 'react-router-dom'
import { PublicNavbar, SiteFooter } from '@/components/layout'

export const PublicLayout = () => {
  const { pathname } = useLocation()
  const isFullBleed = pathname === '/'

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface" dir="rtl">
      <PublicNavbar />
      <main className={isFullBleed ? 'flex-1' : 'page-container flex-1 py-8'}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
