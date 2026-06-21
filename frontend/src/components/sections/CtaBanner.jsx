import { Link } from 'react-router-dom'
import { Button, Icon, SafeImage } from '@/components/ui'
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'
import { ROUTES } from '@/lib/constants/routes'

export const CtaBanner = ({
  title = 'جاهز للانطلاق؟',
  description = 'ابدأ مجاناً — بدون التزام',
  image = HOME_IMAGES.cta,
  primaryAction = { label: 'إنشاء حساب', to: ROUTES.REGISTER },
  secondaryAction = { label: 'ابحث عن مدرسة', to: ROUTES.SCHOOLS_NEARBY },
}) => (
  <section className="relative overflow-hidden rounded-3xl">
    <SafeImage src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-primary/85" />
    <div className="relative px-6 py-16 text-center text-on-primary md:py-24">
      <Icon name="directions_car" size={56} className="mx-auto mb-6 opacity-90" />
      <h2 className="text-headline-md md:text-display-lg-mobile">{title}</h2>
      <p className="mx-auto mt-4 max-w-md text-body-lg opacity-90">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {primaryAction && (
          <Link to={primaryAction.to}>
            <Button size="lg" variant="secondary">{primaryAction.label}</Button>
          </Link>
        )}
        {secondaryAction && (
          <Link to={secondaryAction.to}>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10">
              {secondaryAction.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  </section>
)
