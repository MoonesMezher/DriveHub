import { Outlet } from 'react-router-dom'
import { BrandLogo, SiteFooter } from '@/components/layout'

export const AuthLayout = () => (
  <div className="flex min-h-screen flex-col bg-pattern" dir="rtl">
    <div className="flex flex-1 items-center justify-center p-margin-mobile">
      <div className="relative z-10 w-full max-w-[480px]">
        <div className="mb-loose">
          <BrandLogo subtitle="تقدم آمن ومنهجي نحو مستقبلك في القيادة" />
        </div>
        <div className="glass-card overflow-hidden rounded-xl border border-outline-variant shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
    <SiteFooter compact />
  </div>
)
