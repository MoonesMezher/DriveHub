import { Link } from 'react-router-dom'
import {
  PageHeader,
  Button,
  ImageCard,
  PageSection,
  SectionBlock,
  Badge,
} from '@/components/ui'
import { JourneySteps, CtaBanner } from '@/components/sections'
import { ROUTES } from '@/lib/constants/routes'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'

const requirements = [
  {
    icon: 'cake',
    title: 'السن القانوني',
    desc: 'يجب بلوغ الحد الأدنى للعمر حسب فئة الرخصة (18 سنة للخصوصي، 21 للعمومي).',
    image: HOME_IMAGES.license,
  },
  {
    icon: 'badge',
    title: 'الهوية الوطنية',
    desc: 'بطاقة هوية سارية أو جواز سفر مع إثبات الإقامة للمقيمين.',
    image: HOME_IMAGES.exam,
  },
  {
    icon: 'health_and_safety',
    title: 'الفحص الطبي',
    desc: 'شهادة لياقة طبية من جهة معتمدة تثبت قدرتك على القيادة.',
    image: HOME_IMAGES.medical,
  },
  {
    icon: 'photo_camera',
    title: 'صور شخصية',
    desc: 'عدد 4 صور شخصية بخلفية بيضاء حسب مواصفات إدارة المرور.',
    image: HOME_IMAGES.portrait,
  },
  {
    icon: 'school',
    title: 'التسجيل في مدرسة',
    desc: 'اختيار مدرسة معتمدة ودفع رسوم المنصة والدورة عبر DriveHub.',
    image: HOME_IMAGES.school,
  },
  {
    icon: 'menu_book',
    title: 'اجتياز الامتحانات',
    desc: 'نجاح في الامتحان النظري ثم العملي وفق جدول المرور.',
    image: HOME_IMAGES.theory,
  },
]

const steps = [
  'إنشاء حساب على DriveHub',
  'استكشاف الرخص واختيار الفئة المناسبة',
  'البحث عن مدرسة قريبة والتقديم',
  'دفع الرسوم وانتظار قبول المدرسة',
  'بدء الدروس النظرية والعملية',
  'تقديم امتحان المرور',
]

export const RequirementsPage = () => (
  <div dir="rtl" className="space-y-loose">
    <section className="relative overflow-hidden rounded-3xl shadow-card">
      <img
        src={PUBLIC_HERO_IMAGES.requirements}
        alt="متطلبات التسجيل"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
      <div className="relative px-6 py-12 md:px-10 md:py-16">
        <PageHeader
          title="متطلبات التسجيل"
          description="كل ما تحتاجه قبل التقديم على رخصة القيادة"
          actions={
            <Link to={ROUTES.REGISTER}>
              <Button variant="secondary">إنشاء حساب</Button>
            </Link>
          }
          className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
        />
      </div>
    </section>

    <JourneySteps
      title="رحلتك من التسجيل إلى الرخصة"
      description="ستة خطوات واضحة — ابدأ اليوم"
    />

    <PageSection>
      <SectionBlock
        title="المستندات والشروط"
        description="تأكد من استيفاء كل المتطلبات قبل التقديم"
      >
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
          {requirements.map((item) => (
            <ImageCard
              key={item.title}
              image={item.image}
              alt={item.title}
              aspect="landscape"
              icon={item.icon}
              title={item.title}
              subtitle={item.desc}
            />
          ))}
        </div>
      </SectionBlock>
    </PageSection>

    <PageSection variant="contained">
      <SectionBlock title="خطوات التسجيل" description="من الحساب إلى الرخصة">
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-4">
              <Badge variant="primary" className="mt-0.5 shrink-0">
                {index + 1}
              </Badge>
              <span className="text-body-md text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </SectionBlock>
    </PageSection>

    <CtaBanner
      title="جاهز للبدء؟"
      description="استكشف الرخص أو ابحث عن مدرسة قريبة"
      primaryAction={{ label: 'استكشاف الرخص', to: ROUTES.LICENSES }}
      secondaryAction={{ label: 'البحث عن مدارس', to: ROUTES.SCHOOLS_NEARBY }}
    />
  </div>
)
