import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader,
  AsyncContent,
  Badge,
  Button,
  Icon,
  GovernorateSelect,
  ImageCard,
  PageSection,
  SectionBlock,
  Alert,
} from '@/components/ui'
import { SchoolsMap } from '@/features/schools/components/SchoolsMap'
import { mapProviderLabel } from '@/lib/config/maps'
import { schoolService, locationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { useAuthContext } from '@/app/providers/AuthProvider'
import { DEFAULT_USER_COORDS } from '@/lib/constants/syriaMap'
import { getGovernorateCoords } from '@/lib/constants/governorateCenters'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'

const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)

export const SchoolsNearbyPage = () => {
  const { isAuthenticated } = useAuthContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [coords, setCoords] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [locating, setLocating] = useState(false)
  const [highlightedSchoolId, setHighlightedSchoolId] = useState(null)
  const [manualGovernorate, setManualGovernorate] = useState('')

  const persistLocation = (lat, lng) => {
    if (!isAuthenticated) return
    locationService.save({ lat, lng }).catch(() => {})
  }

  const category = searchParams.get('category') || ''
  const femaleCoach = searchParams.get('femaleCoach') === 'true'

  const queryCoords = coords
    ?? (manualGovernorate ? getGovernorateCoords(manualGovernorate) : null)
    ?? DEFAULT_USER_COORDS

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('المتصفح لا يدعم تحديد الموقع — تُعرض المدارس من موقع افتراضي')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        persistLocation(lat, lng)
        setGeoError('')
        setLocating(false)
      },
      () => {
        setGeoError('تعذّر الحصول على موقعك — تُعرض المدارس من موقع افتراضي (دمشق)')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const mapQuery = useQuery({
    queryKey: ['schools', 'map', queryCoords.lat, queryCoords.lng, category, femaleCoach],
    queryFn: async () =>
      unwrap(
        await schoolService.getMap({
          lat: queryCoords.lat,
          lng: queryCoords.lng,
          category: category || undefined,
          femaleCoach: femaleCoach || undefined,
        }),
      ),
  })

  const schools = Array.isArray(mapQuery.data?.schools) ? mapQuery.data.schools : []

  const toggleFemaleCoach = () => {
    const next = new URLSearchParams(searchParams)
    if (femaleCoach) next.delete('femaleCoach')
    else next.set('femaleCoach', 'true')
    setSearchParams(next)
  }

  const retryLocation = () => {
    setGeoError('')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        persistLocation(lat, lng)
        setLocating(false)
      },
      () => {
        setGeoError('تعذّر الحصول على موقعك')
        setLocating(false)
      },
    )
  }

  return (
    <div dir="rtl" className="space-y-loose">
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={PUBLIC_HERO_IMAGES.schools}
          alt="أقرب المدارس"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <PageHeader
            title="أقرب المدارس"
            description="خريطة تفاعلية لتوزيع مدارس المنصة في سوريا — مرتّبة حسب المسافة من موقعك"
            className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
          />
        </div>
      </section>

      <PageSection variant="contained">
        <div className="flex flex-wrap items-center gap-3">
          {category && (
            <Badge variant="primary" className="px-3 py-1.5">
              <Icon name="filter_alt" size={16} className="me-1" />
              رخصة {category}
            </Badge>
          )}
          <Button
            variant={femaleCoach ? 'primary' : 'outline'}
            size="sm"
            onClick={toggleFemaleCoach}
            leftIcon={<Icon name="woman" size={18} />}
          >
            مدربات إناث
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={retryLocation}
            disabled={locating}
            leftIcon={<Icon name="my_location" size={18} />}
          >
            {locating ? 'جاري التحديد...' : 'تحديث الموقع'}
          </Button>
          <span className="ms-auto text-label-md text-on-surface-variant">
            {schools.length} مدرسة
          </span>
        </div>
      </PageSection>

      <PageSection variant="elevated" className="!p-0 overflow-hidden">
        <div className="border-b border-outline-variant bg-surface-container px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body-md font-medium text-on-surface">خريطة المدارس في سوريا</p>
            <div className="flex flex-wrap items-center gap-3 text-label-md text-on-surface-variant">
              <span className="text-label-sm opacity-70">{mapProviderLabel()}</span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-primary" />
                مدرسة
              </span>
              {coords && (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-primary bg-primary-container" />
                  موقعك
                </span>
              )}
            </div>
          </div>
        </div>
        <SchoolsMap
          schools={schools}
          userCoords={coords}
          highlightedSchoolId={highlightedSchoolId}
          onSelectSchool={setHighlightedSchoolId}
        />
      </PageSection>

      {geoError && (
        <Alert variant="warning" title="تعذّر تحديد الموقع">
          <p>{geoError}</p>
          <p className="mt-2">اختر محافظتك لعرض المدارس القريبة:</p>
          <div className="mt-4 max-w-xs">
            <GovernorateSelect
              value={manualGovernorate}
              onChange={(e) => setManualGovernorate(e.target.value)}
              allowEmpty={false}
              placeholder="اختر المحافظة"
            />
          </div>
          <Button variant="outline" className="mt-4" size="sm" onClick={retryLocation}>
            إعادة المحاولة (GPS)
          </Button>
        </Alert>
      )}

      <SectionBlock title="قائمة المدارس" description="مرّر على البطاقة لتمييزها على الخريطة">
        <AsyncContent
          isLoading={mapQuery.isLoading}
          error={mapQuery.error}
          isEmpty={!schools.length}
          emptyIcon="location_off"
          emptyTitle="لا توجد مدارس"
          emptyDescription="جرّب إزالة الفلاتر أو تحقق لاحقاً."
        >
          {() => (
            <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <div
                  key={school._id}
                  onMouseEnter={() => setHighlightedSchoolId(school._id)}
                  onFocus={() => setHighlightedSchoolId(school._id)}
                  className={
                    highlightedSchoolId === school._id
                      ? 'rounded-2xl ring-2 ring-secondary ring-offset-2'
                      : undefined
                  }
                >
                  <ImageCard
                    to={`/schools/${school._id}`}
                    image={HOME_IMAGES.school}
                    title={school.name}
                    subtitle={
                      [school.address, school.governorate].filter(Boolean).join(' — ') || undefined
                    }
                    aspect="landscape"
                    badge={
                      school.distanceKm != null ? formatDistance(school.distanceKm) : undefined
                    }
                    footer={
                      <div className="flex flex-wrap items-center gap-2">
                        {school.hasFemaleCoaches && (
                          <Badge variant="secondary">مدربات</Badge>
                        )}
                        {school.licenses?.map((lic) => (
                          <Badge key={lic} variant="default">
                            {lic}
                          </Badge>
                        ))}
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </AsyncContent>
      </SectionBlock>
    </div>
  )
}
