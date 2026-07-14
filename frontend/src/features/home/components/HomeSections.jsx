import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Badge, ImageCard, Skeleton } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { schoolService, licenseService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { DEFAULT_USER_COORDS } from '@/lib/constants/syriaMap'
import { HOME_IMAGES, LICENSE_IMAGES } from '@/lib/constants/homeVisuals'
import {
  TrustStrip,
  JourneySteps,
  TestimonialsRow,
  BenefitsZigzag,
  FaqAccordion,
  CtaBanner,
} from '@/components/sections'

const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)

const HOME_FAQ = [
  { id: 'how', title: 'كيف أبدأ؟', content: 'أنشئ حساباً مجاناً → اختر الرخصة → سجّل في مدرسة قريبة. كل خطوة واضحة في لوحتك.' },
  { id: 'free', title: 'هل هناك تجربة مجانية؟', content: 'نعم — جرّب عينة الأسئلة النظرية قبل التسجيل الكامل.' },
  { id: 'exam', title: 'من ينسّق امتحان المرور؟', content: 'المدرسة والمنصة مع إدارة المرور — مواعيد ونتائج في مكان واحد.' },
]

export { TrustStrip, JourneySteps, TestimonialsRow, BenefitsZigzag, CtaBanner }

export const PopularLicenses = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['licenses', 'home'],
    queryFn: async () => unwrap(await licenseService.list()),
  })
  const licenses = (Array.isArray(data) ? data : []).slice(0, 4)

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-loose text-headline-md text-primary">اختر نوع الرخصة</h2>
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </section>
    )
  }

  if (!licenses.length) return null

  return (
    <section>
      <div className="mb-loose flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-md text-primary">اختر نوع الرخصة</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">اضغط للتفاصيل</p>
        </div>
        <Link to={ROUTES.LICENSES}>
          <Button variant="outline" size="sm">كل الفئات</Button>
        </Link>
      </div>
      <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
        {licenses.map((license) => (
          <ImageCard
            key={license.code}
            to={`/licenses/${license.code}`}
            image={LICENSE_IMAGES[license.code] || LICENSE_IMAGES.default}
            alt={license.name}
            aspect="portrait"
            badge={`${license.minAge}+ سنة`}
            title={license.name}
            subtitle={license.code}
          />
        ))}
      </div>
    </section>
  )
}

export const NearbySchoolsVisual = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['schools', 'home', 'nearby'],
    queryFn: async () =>
      unwrap(
        await schoolService.getNearby({
          lat: DEFAULT_USER_COORDS.lat,
          lng: DEFAULT_USER_COORDS.lng,
          limit: 6,
        }),
      ),
  })

  const schools = (Array.isArray(data) ? data : data?.items ?? []).slice(0, 6)

  if (isLoading || !schools.length) return null

  return (
    <section>
      <div className="mb-loose flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-md text-primary">مدارس قريبة منك</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">اختر مدرسة وابدأ التسجيل</p>
        </div>
        <Link to={ROUTES.SCHOOLS_NEARBY}>
          <Button variant="primary" size="sm">عرض الخريطة</Button>
        </Link>
      </div>
      <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <ImageCard
            key={school._id}
            to={`/schools/${school._id}`}
            image={HOME_IMAGES.school}
            title={school.name}
            subtitle={school.governorate}
            aspect="landscape"
            badge={school.distanceKm != null ? formatDistance(school.distanceKm) : undefined}
            footer={school.licenses?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {school.licenses.slice(0, 4).map((lic) => (
                  <Badge key={lic} variant="default">{lic}</Badge>
                ))}
              </div>
            )}
          />
        ))}
      </div>
    </section>
  )
}

export const HomeFaqPreview = () => (
  <FaqAccordion items={HOME_FAQ} showMoreLink />
)

export const HomeFinalCta = () => <CtaBanner />
