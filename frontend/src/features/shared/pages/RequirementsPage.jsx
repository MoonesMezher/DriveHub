import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader,
  Button,
  ImageCard,
  PageSection,
  SectionBlock,
  Badge,
  Alert,
} from '@/components/ui'
import { JourneySteps, CtaBanner } from '@/components/sections'
import { ROUTES } from '@/lib/constants/routes'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'
import { HOME_IMAGES, JOURNEY_STEPS } from '@/lib/constants/homeVisuals'
import { REQUIREMENT_SECTIONS } from '@/lib/constants/requirementSections'
import { requirementService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

const FALLBACK_DOCUMENTS = [
  {
    icon: 'cake',
    title: 'السن القانوني',
    description: 'يجب بلوغ الحد الأدنى للعمر حسب فئة الرخصة (18 سنة للخصوصي، 21 للعمومي).',
    image: HOME_IMAGES.license,
  },
  {
    icon: 'badge',
    title: 'الهوية الوطنية',
    description: 'بطاقة هوية سارية أو جواز سفر مع إثبات الإقامة للمقيمين.',
    image: HOME_IMAGES.exam,
  },
  {
    icon: 'health_and_safety',
    title: 'الفحص الطبي',
    description: 'شهادة لياقة طبية من جهة معتمدة تثبت قدرتك على القيادة.',
    image: HOME_IMAGES.medical,
  },
  {
    icon: 'photo_camera',
    title: 'صور شخصية',
    description: 'عدد 4 صور شخصية بخلفية بيضاء حسب مواصفات إدارة المرور.',
    image: HOME_IMAGES.portrait,
  },
  {
    icon: 'school',
    title: 'التسجيل في مدرسة',
    description: 'اختيار مدرسة معتمدة ودفع رسوم الدورة مباشرةً للمدرسة ثم تأكيد الاستلام من المنصة.',
    image: HOME_IMAGES.school,
  },
  {
    icon: 'menu_book',
    title: 'اجتياز الامتحانات',
    description: 'نجاح في الامتحان النظري ثم العملي وفق جدول المرور.',
    image: HOME_IMAGES.theory,
  },
]

const FALLBACK_STEPS = [
  'إنشاء حساب على DriveHub',
  'استكشاف الرخص واختيار الفئة المناسبة',
  'البحث عن مدرسة قريبة والتقديم',
  'دفع الرسوم للمدرسة وانتظار تأكيد الاستلام',
  'بدء الدروس النظرية والعملية',
  'تقديم امتحان المرور',
]

const bySection = (items, section) =>
  items
    .filter((item) => (item.section || REQUIREMENT_SECTIONS.DOCUMENTS) === section)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

const mapDocuments = (items = []) =>
  items.map((item) => ({
    id: item._id,
    icon: item.icon || 'check_circle',
    title: item.title,
    desc: item.description,
    image: resolveMediaUrl(item.imageUrl) || HOME_IMAGES.license,
  }))

const mapJourney = (items = []) =>
  items.map((item) => ({
    id: item._id,
    icon: item.icon || 'check_circle',
    label: item.title,
    image: resolveMediaUrl(item.imageUrl) || HOME_IMAGES.register,
  }))

const mapSteps = (items = []) =>
  items.map((item) => ({
    id: item._id,
    title: item.title,
    description: item.description || '',
  }))

export const RequirementsPage = () => {
  const requirementsQuery = useQuery({
    queryKey: ['requirements'],
    queryFn: () => requirementService.list().then(unwrap),
    staleTime: 60_000,
  })

  const apiItems = requirementsQuery.data?.items ?? []

  const { journeySteps, documents, registrationSteps } = useMemo(() => {
    const journeyApi = bySection(apiItems, REQUIREMENT_SECTIONS.JOURNEY)
    const documentsApi = bySection(apiItems, REQUIREMENT_SECTIONS.DOCUMENTS)
    const stepsApi = bySection(apiItems, REQUIREMENT_SECTIONS.STEPS)

    return {
      journeySteps: journeyApi.length > 0 ? mapJourney(journeyApi) : JOURNEY_STEPS,
      documents: documentsApi.length > 0
        ? mapDocuments(documentsApi)
        : FALLBACK_DOCUMENTS.map((item, index) => ({
          ...item,
          id: `fallback-doc-${index}`,
          desc: item.description,
        })),
      registrationSteps: stepsApi.length > 0
        ? mapSteps(stepsApi)
        : FALLBACK_STEPS.map((title, index) => ({
          id: `fallback-step-${index}`,
          title,
          description: '',
        })),
    }
  }, [apiItems])

  return (
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

      {requirementsQuery.isError && (
        <Alert variant="warning" title="تعذّر تحميل المتطلبات من الخادم">
          نعرض المتطلبات الافتراضية مؤقتاً.
        </Alert>
      )}

      <JourneySteps
        title="رحلتك من التسجيل إلى الرخصة"
        description="من التسجيل إلى الرخصة — ابدأ اليوم"
        steps={journeySteps}
      />

      <PageSection>
        <SectionBlock
          title="المستندات والشروط"
          description="تأكد من استيفاء كل المتطلبات قبل التقديم"
        >
          <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((item) => (
              <ImageCard
                key={item.id || item.title}
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
            {registrationSteps.map((step, index) => (
              <li key={step.id || step.title} className="flex items-start gap-4">
                <Badge variant="primary" className="mt-0.5 shrink-0">
                  {index + 1}
                </Badge>
                <div>
                  <span className="text-body-md text-on-surface">{step.title}</span>
                  {step.description ? (
                    <p className="mt-1 text-body-sm text-on-surface-variant">{step.description}</p>
                  ) : null}
                </div>
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
}
