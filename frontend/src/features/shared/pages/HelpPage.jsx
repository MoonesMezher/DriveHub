import { Link } from 'react-router-dom'
import { PageHeader, Badge, Accordion, PageSection, SectionBlock, Button, Icon } from '@/components/ui'
import { CtaBanner } from '@/components/sections'
import { ROUTES } from '@/lib/constants/routes'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'

const HELP_SECTIONS = [
  {
    id: 'register-enroll',
    title: 'التسجيل والاشتراك في دورة',
    content: (
      <div className="space-y-3">
        <ol className="list-decimal space-y-2 ps-5">
          <li>
            أنشئ حساباً من صفحة{' '}
            <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
              تسجيل جديد
            </Link>
            .
          </li>
          <li>
            استكشف{' '}
            <Link to={ROUTES.LICENSES} className="font-medium text-primary hover:underline">
              أنواع الرخص
            </Link>{' '}
            واختر الفئة المناسبة.
          </li>
          <li>
            من{' '}
            <Link to={ROUTES.SCHOOLS_NEARBY} className="font-medium text-primary hover:underline">
              أقرب المدارس
            </Link>{' '}
            اختر مدرسة وقدّم طلب اشتراك (بعد تسجيل الدخول).
          </li>
          <li>انتظر مراجعة المدرسة؛ عند القبول تنتقل إلى مرحلة الدفع من رصيدك.</li>
        </ol>
        <p>
          لمتابعة طلبك بعد الدخول: صفحة{' '}
          <Link to={ROUTES.ENROLL} className="font-medium text-primary hover:underline">
            طلب اشتراك
          </Link>
          .
        </p>
      </div>
    ),
  },
  {
    id: 'documents',
    title: 'المستندات المطلوبة',
    content: (
      <div className="space-y-3">
        <p>قبل التقديم تحتاج عادةً إلى:</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>هوية وطنية سارية (أو جواز مع إثبات إقامة للمقيمين).</li>
          <li>شهادة فحص طبي / لياقة من جهة معتمدة.</li>
        </ul>
        <p>
          التفاصيل الكاملة والخطوات في صفحة{' '}
          <Link to={ROUTES.REQUIREMENTS} className="font-medium text-primary hover:underline">
            متطلبات التسجيل
          </Link>
          .
        </p>
      </div>
    ),
  },
  {
    id: 'wallet-payment',
    title: 'الدفع عبر المحفظة',
    content: (
      <div className="space-y-3">
        <p>
          الدفع داخل المنصة يتم من رصيد محفظتك: يشحن مدير المنصة رصيدك بعد الدفع النقدي أو التحويل، ثم تخصم رسوم الدورة من الرصيد عند تأكيد الدفع في صفحة الاشتراك.
        </p>
        <ul className="list-disc space-y-1 ps-5">
          <li>لا يوجد دفع إلكتروني مباشر عبر بطاقة من المنصة.</li>
          <li>إن كان الرصيد غير كافٍ، تواصل مع إدارة المنصة لشحن المحفظة.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'roles',
    title: 'أدوار المستخدمين باختصار',
    content: (
      <ul className="list-disc space-y-2 ps-5">
        <li>
          <span className="font-medium text-on-surface">مسجّل / طالب:</span> استكشاف، تقديم طلب، تعلم ودروس بعد الاشتراك.
        </li>
        <li>
          <span className="font-medium text-on-surface">مدرب:</span> الجدول، تقييم الدروس، ملاحظات للطلاب المسندين إليه.
        </li>
        <li>
          <span className="font-medium text-on-surface">مدير مدرسة:</span> الدورات، الالتحاق، المدربون، المحتوى.
        </li>
        <li>
          <span className="font-medium text-on-surface">مدير المنصة:</span> المدارس، التسعير، شحن المحافظ، الإعدادات.
        </li>
        <li>
          <span className="font-medium text-on-surface">المرور:</span> القوائم ومواعيد ونتائج الامتحان.
        </li>
      </ul>
    ),
  },
  {
    id: 'password',
    title: 'نسيت كلمة المرور',
    content: (
      <p>
        من صفحة{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          تسجيل الدخول
        </Link>{' '}
        اختر «نسيت كلمة المرور؟» أو افتح مباشرة{' '}
        <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-primary hover:underline">
          استعادة كلمة المرور
        </Link>
        .
      </p>
    ),
  },
]

const QUICK_LINKS = [
  { to: ROUTES.FAQ, label: 'الأسئلة الشائعة', icon: 'help' },
  { to: ROUTES.REQUIREMENTS, label: 'المتطلبات', icon: 'checklist' },
  { to: ROUTES.LICENSES, label: 'أنواع الرخص', icon: 'badge' },
  { to: ROUTES.ADD_SCHOOL, label: 'أضف مدرستك', icon: 'domain_add' },
  { to: ROUTES.SAMPLE, label: 'عينة مجانية', icon: 'quiz' },
  { to: ROUTES.PRIVACY, label: 'سياسة الخصوصية', icon: 'privacy_tip' },
]

export const HelpPage = () => (
  <div dir="rtl" className="space-y-loose">
    <section className="relative overflow-hidden rounded-3xl shadow-card">
      <img
        src={PUBLIC_HERO_IMAGES.help}
        alt="المساعدة"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
      <div className="relative px-6 py-12 md:px-10 md:py-16">
        <Badge variant="secondary" className="mb-4 bg-white/20 text-white backdrop-blur">
          دليل سريع
        </Badge>
        <PageHeader
          title="المساعدة"
          description="كيف تستخدم DriveHub: التسجيل، المستندات، الدفع، والأدوار"
          className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
        />
      </div>
    </section>

    <PageSection variant="contained">
      <SectionBlock title="مواضيع المساعدة">
        <Accordion items={HELP_SECTIONS} />
      </SectionBlock>
    </PageSection>

    <PageSection variant="elevated">
      <SectionBlock
        title="روابط مفيدة"
        description="للتفاصيل والأسئلة المتكررة — دون تكرار محتوى الأسئلة الشائعة هنا"
      >
        <div className="flex flex-wrap gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Icon name={link.icon} size={18} />}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
        <p className="mt-comfortable text-body-md text-on-surface-variant">
          للدعم وشحن الرصيد: تواصل مع إدارة المنصة بعد إنشاء حسابك. لطلب انضمام مدرسة استخدم «أضف مدرستك».
        </p>
      </SectionBlock>
    </PageSection>

    <CtaBanner
      title="ما زلت تحتاج مساعدة؟"
      description="راجع الأسئلة الشائعة أو ابدأ بإنشاء حساب"
      primaryAction={{ label: 'الأسئلة الشائعة', to: ROUTES.FAQ }}
      secondaryAction={{ label: 'إنشاء حساب', to: ROUTES.REGISTER }}
    />
  </div>
)
