import { Outlet } from 'react-router-dom'
import { BrandLogo, SiteFooter } from '@/components/layout'
import { Card, Icon } from '@/components/ui'
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'

export const AuthLayout = () => (
  <div className="flex min-h-screen bg-pattern" dir="rtl">
    <div className="relative hidden flex-1 lg:block">
      <img
        src={HOME_IMAGES.hero}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-primary/70" />
      <div className="relative flex h-full flex-col justify-center p-loose text-on-primary">
        <h2 className="text-display-lg-mobile font-bold">تعلّم القيادة بثقة</h2>
        <p className="mt-4 max-w-md text-body-lg opacity-90">
          منصة موحّدة لإدارة التعليم والامتحانات في مدارس القيادة السورية
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          {[
            { icon: 'verified', label: 'مدارس معتمدة' },
            { icon: 'lock', label: 'بيانات آمنة' },
            { icon: 'smartphone', label: 'من أي جهاز' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
              <Icon name={item.icon} size={20} />
              <span className="text-label-md">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center p-margin-mobile">
        <div className="w-full max-w-[480px]">
          <div className="mb-loose flex justify-center">
            <div className="lg:hidden">
              <BrandLogo subtitle="تقدم آمن ومنهجي نحو مستقبلك في القيادة" />
            </div>
            <div className="hidden lg:block">
              <BrandLogo compact />
            </div>
          </div>
          <Card variant="elevated" padding="none" size="lg" className="overflow-hidden">
            <Outlet />
          </Card>
        </div>
      </div>
      <SiteFooter variant="compact" />
    </div>
  </div>
)
