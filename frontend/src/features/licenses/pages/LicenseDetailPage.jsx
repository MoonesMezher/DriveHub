import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader,
  Card,
  AsyncContent,
  Badge,
  Button,
  Icon,
  ImageCard,
  PageSection,
  SectionBlock,
} from '@/components/ui'
import { JourneySteps, CtaBanner } from '@/components/sections'
import { licenseService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { ROUTES } from '@/lib/constants/routes'
import { HOME_IMAGES, LICENSE_IMAGES } from '@/lib/constants/homeVisuals'
import {
  PREREQUISITE_TYPE_ICONS,
  PREREQUISITE_TYPE_SUBTITLES,
  normalizePrerequisites,
} from '@/lib/constants/licensePrerequisites'

const resolveLicense = (data) => {
  if (!data || typeof data !== 'object') return null
  const candidate = data.license ?? (data.code ? data : null)
  return candidate && typeof candidate === 'object' ? candidate : null
}

const prerequisiteSubtitle = (item) => {
  const base = PREREQUISITE_TYPE_SUBTITLES[item.type] || 'متطلب'
  return item.isRequired === false ? `${base} (اختياري)` : base
}

const LicenseDetailContent = ({ license }) => {
  const prerequisites = normalizePrerequisites(license.prerequisites)

  return (
    <div className="space-y-loose">
      <JourneySteps
        title={`رحلتك للحصول على رخصة ${license.code}`}
        description="من التسجيل إلى الرخصة — خطوة بخطوة"
      />

      <div className="bento-grid">
        <Card className="col-span-12 md:col-span-8" title="نظرة عامة">
          {license.briefDesc && (
            <Badge variant="secondary" className="mb-4">
              {license.briefDesc}
            </Badge>
          )}
          <p className="text-body-lg text-on-surface">
            {license.fullDesc || license.briefDesc || 'لا يوجد وصف تفصيلي.'}
          </p>
          {license.vehicleTypes && (
            <p className="mt-4 text-body-md text-on-surface-variant">
              <span className="font-medium text-on-surface">المركبات: </span>
              {license.vehicleTypes}
            </p>
          )}
        </Card>

        <PageSection variant="contained" className="col-span-12 md:col-span-4">
          <SectionBlock
            title="المتطلبات"
            description={license.requirementsIntro || 'ما تحتاجه قبل التقديم'}
          >
            <div className="space-y-comfortable">
              <ImageCard
                image={HOME_IMAGES.license}
                alt="الحد الأدنى للعمر"
                aspect="landscape"
                icon="cake"
                title={`الحد الأدنى للعمر: ${license.minAge ?? '—'} سنة`}
                subtitle="شرط العمر"
              />
              {prerequisites.length > 0 ? (
                prerequisites.map((req, index) => (
                  <ImageCard
                    key={`${req.label}-${req.code || index}`}
                    image={HOME_IMAGES.exam}
                    alt={req.label}
                    aspect="landscape"
                    icon={PREREQUISITE_TYPE_ICONS[req.type] || 'check_circle'}
                    title={req.label}
                    subtitle={prerequisiteSubtitle(req)}
                  />
                ))
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-comfortable text-body-md text-on-surface-variant">
                  <Icon name="info" size={20} />
                  <span>لا توجد متطلبات مسبقة</span>
                </div>
              )}
            </div>
          </SectionBlock>
        </PageSection>

        {license.subTypeDetails?.length > 0 && (
          <Card className="col-span-12" title="الأنواع الفرعية">
            <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
              {license.subTypeDetails.map((sub) => (
                <ImageCard
                  key={sub.subCode}
                  image={LICENSE_IMAGES[sub.subCode] || LICENSE_IMAGES[license.code] || LICENSE_IMAGES.default}
                  alt={sub.name}
                  aspect="landscape"
                  badge={sub.subCode}
                  title={sub.name}
                  subtitle={sub.description}
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      <CtaBanner
        title="جاهز للتسجيل؟"
        description={`ابحث عن مدرسة قريبة تقدّم رخصة ${license.code}`}
        primaryAction={{ label: 'البحث عن مدارس', to: `${ROUTES.SCHOOLS_NEARBY}?category=${license.code}` }}
        secondaryAction={{ label: 'كل الرخص', to: ROUTES.LICENSES }}
      />
    </div>
  )
}

export const LicenseDetailPage = () => {
  const { code } = useParams()

  const licenseQuery = useQuery({
    queryKey: ['licenses', code],
    queryFn: async () => unwrap(await licenseService.getByCode(code)),
    enabled: Boolean(code),
  })

  const license = resolveLicense(licenseQuery.data)

  return (
    <div dir="rtl" className="space-y-loose">
      <PageHeader
        title={license ? `${license.name} (${license.code})` : 'تفاصيل الرخصة'}
        description="المتطلبات والأنواع الفرعية لهذه الفئة"
        actions={
          <Link to={ROUTES.LICENSES}>
            <Button variant="outline" leftIcon={<Icon name="arrow_forward" size={18} />}>
              كل الرخص
            </Button>
          </Link>
        }
        size="md"
      />

      <AsyncContent
        isLoading={licenseQuery.isPending}
        error={licenseQuery.error}
        isEmpty={!license}
        emptyIcon="badge"
        emptyTitle="الرخصة غير موجودة"
        emptyDescription="تعذّر العثور على هذه الفئة. ارجع لقائمة الرخص وحاول مجدداً."
      >
        {() => (license ? <LicenseDetailContent license={license} /> : null)}
      </AsyncContent>
    </div>
  )
}
