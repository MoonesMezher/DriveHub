import { Outlet } from 'react-router-dom'
import { PublicNavbar, SiteFooter } from '@/components/layout'

export const PublicLayout = () => (
  <div className="flex min-h-screen flex-col bg-background text-on-surface" dir="rtl">
    <PublicNavbar />
    <main className="page-container flex-1 py-8">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
)
