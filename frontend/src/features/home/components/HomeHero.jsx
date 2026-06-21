import { Link } from 'react-router-dom'
import { Button, Icon, SafeImage } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { HOME_IMAGES, JOURNEY_STEPS } from '@/lib/constants/homeVisuals'

export const HomeHero = () => (
  <section className="relative overflow-hidden rounded-3xl bg-surface-container-lowest shadow-card">
    <div className="grid min-h-[420px] lg:grid-cols-2 lg:min-h-[520px]">
      {/* نص + مسار مرئي */}
      <div className="flex flex-col justify-center p-6 md:p-10 lg:p-12">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-label-md font-medium text-on-primary-container">
          <Icon name="verified" size={20} />
          <span>منصة تعليم القيادة في سوريا</span>
        </div>

        <h1 className="text-display-lg-mobile leading-tight text-primary md:text-display-lg">
          تعلّم القيادة
          <span className="mt-1 block text-secondary">احصل على رخصتك</span>
        </h1>

        {/* مسار بصري — بدون فقرات */}
        <div className="mt-8 flex flex-wrap items-center gap-2 md:gap-3">
          {JOURNEY_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-md">
                  <Icon name={step.icon} size={28} />
                </div>
                <span className="text-label-sm font-semibold text-on-surface">{step.label}</span>
              </div>
              {i < JOURNEY_STEPS.length - 1 && (
                <Icon name="chevron_left" size={22} className="hidden text-on-surface-variant sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" className="min-w-[160px] shadow-lg">
              ابدأ الآن — مجاناً
            </Button>
          </Link>
          <Link to={ROUTES.SAMPLE}>
            <Button size="lg" variant="outline">
              جرّب بدون تسجيل
            </Button>
          </Link>
        </div>
      </div>

      {/* صورة بطل */}
      <div className="relative min-h-[280px] lg:min-h-full">
        <SafeImage
          src={HOME_IMAGES.hero}
          alt="تعلّم القيادة والحصول على الرخصة"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-surface-container-lowest/90 lg:via-transparent lg:to-transparent" />

        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 lg:bottom-8 lg:left-8 lg:right-8">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-label-md font-semibold text-primary shadow-lg backdrop-blur">
            <Icon name="menu_book" size={20} />
            نظري + عملي
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-label-md font-semibold text-secondary shadow-lg backdrop-blur">
            <Icon name="location_on" size={20} />
            مدارس قريبة
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-label-md font-semibold text-on-secondary shadow-lg">
            <Icon name="account_balance" size={20} />
            متكامل مع المرور
          </span>
        </div>
      </div>
    </div>
  </section>
)
