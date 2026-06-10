import { Link } from 'react-router-dom'
import { Card, Button, Icon } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

const features = [
  {
    icon: 'badge',
    title: 'استكشف الرخص',
    desc: 'تعرف على أنواع الرخص ومتطلباتها قبل التسجيل',
    to: ROUTES.LICENSES,
    cta: 'عرض الرخص',
  },
  {
    icon: 'location_on',
    title: 'أقرب المدارس',
    desc: 'اعثر على مدرسة قريبة من موقعك مع خريطة تفاعلية',
    to: ROUTES.SCHOOLS_NEARBY,
    cta: 'البحث الجغرافي',
  },
  {
    icon: 'school',
    title: 'ابدأ التسجيل',
    desc: 'أنشئ حساباً للوصول للعينة الكاملة والتقديم',
    to: ROUTES.REGISTER,
    cta: 'تسجيل جديد',
  },
  {
    icon: 'checklist',
    title: 'متطلبات التسجيل',
    desc: 'تأكد من استيفاء الشروط قبل التقديم لأي مدرسة',
    to: ROUTES.REQUIREMENTS,
    cta: 'عرض المتطلبات',
  },
  {
    icon: 'domain_add',
    title: 'أضف مدرستك',
    desc: 'سجّل مدرسة تعليم قيادة جديدة على المنصة',
    to: ROUTES.ADD_SCHOOL,
    cta: 'تقديم طلب',
  },
  {
    icon: 'help',
    title: 'الأسئلة الشائعة',
    desc: 'إجابات عن التسجيل والدفع وامتحان المرور',
    to: ROUTES.FAQ,
    cta: 'اقرأ المزيد',
  },
]

export const HomePage = () => (
  <div>
    <section className="mb-loose rounded-2xl bg-primary-container p-loose text-on-primary-container md:p-12">
      <div className="relative z-10 max-w-2xl">
        <BadgeHero />
        <h1 className="text-display-lg-mobile md:text-display-lg">
          منصتك المتكاملة لتعليم القيادة
        </h1>
        <p className="mt-4 text-body-lg opacity-90">
          تعلم نظري وعملي، إدارة دورات منظّمة، وتنسيق امتحان المرور — في مكان واحد.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to={ROUTES.REGISTER}>
            <Button variant="secondary">ابدأ الآن</Button>
          </Link>
          <Link to={ROUTES.SAMPLE}>
            <Button variant="outline" className="border-on-primary-container/40 text-on-primary-container hover:bg-on-primary-container/10">
              جرّب العينة المجانية
            </Button>
          </Link>
        </div>
      </div>
    </section>

    <div className="bento-grid">
      {features.map((f) => (
        <Card key={f.to} hoverable className="col-span-12 sm:col-span-6 lg:col-span-4">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary">
            <Icon name={f.icon} size={26} />
          </div>
          <h3 className="text-headline-sm text-primary">{f.title}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{f.desc}</p>
          <Link to={f.to} className="mt-4 inline-flex items-center gap-1 text-label-md font-medium text-primary">
            {f.cta}
            <Icon name="arrow_back" size={18} />
          </Link>
        </Card>
      ))}
    </div>
  </div>
)

const BadgeHero = () => (
  <span className="mb-4 inline-block rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
    معتمد من إدارة المرور
  </span>
)
