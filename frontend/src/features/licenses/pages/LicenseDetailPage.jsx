import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, AsyncContent, Badge, Button, Icon } from '@/components/ui'
import { licenseService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { ROUTES } from '@/lib/constants/routes'

const resolveLicense = (data) => {
  if (!data || typeof data !== 'object') return null
  const candidate = data.license ?? (data.code ? data : null)
  return candidate && typeof candidate === 'object' ? candidate : null
}

const LicenseDetailContent = ({ license }) => (
  <div className="bento-grid">
    <Card className="col-span-12 md:col-span-8" title="نظرة عامة">
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

    <Card className="col-span-12 md:col-span-4" title="المتطلبات">
      <ul className="space-y-3">
        <li className="flex items-center gap-2 text-body-md">
          <Icon name="cake" size={20} className="text-primary" />
          <span>الحد الأدنى للعمر: {license.minAge ?? '—'} سنة</span>
        </li>
        {license.prerequisites?.length > 0 ? (
          license.prerequisites.map((req) => (
            <li key={req} className="flex items-center gap-2 text-body-md">
              <Icon name="check_circle" size={20} className="text-success" />
              <span>رخصة {req} مسبقاً</span>
            </li>
          ))
        ) : (
          <li className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Icon name="info" size={20} />
            <span>لا توجد متطلبات مسبقة</span>
          </li>
        )}
      </ul>
    </Card>

    {license.subTypeDetails?.length > 0 && (
      <Card className="col-span-12" title="الأنواع الفرعية">
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
          {license.subTypeDetails.map((sub) => (
            <div
              key={sub.subCode}
              className="rounded-lg border border-outline-variant bg-surface-container-low p-comfortable"
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="primary">{sub.subCode}</Badge>
                <span className="text-label-md font-medium">{sub.name}</span>
              </div>
              {sub.description && (
                <p className="text-body-md text-on-surface-variant">{sub.description}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    )}

    <Card variant="tinted" className="col-span-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-headline-sm">جاهز للتسجيل؟</h3>
        <p className="mt-1 text-body-md opacity-90">
          ابحث عن مدرسة قريبة تقدّم رخصة {license.code}
        </p>
      </div>
      <Link to={`${ROUTES.SCHOOLS_NEARBY}?category=${license.code}`}>
        <Button variant="secondary">البحث عن مدارس</Button>
      </Link>
    </Card>
  </div>
)

export const LicenseDetailPage = () => {
  const { code } = useParams()

  const licenseQuery = useQuery({
    queryKey: ['licenses', code],
    queryFn: async () => unwrap(await licenseService.getByCode(code)),
    enabled: Boolean(code),
  })

  const license = resolveLicense(licenseQuery.data)

  return (
    <div dir="rtl">
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
