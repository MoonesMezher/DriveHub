import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, AsyncContent, Badge, Button, Icon } from '@/components/ui'
import { schoolService, locationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { useAuthContext } from '@/app/providers/AuthProvider'

const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)} م` : `${km.toFixed(1)} كم`)

export const SchoolsNearbyPage = () => {
  const { isAuthenticated } = useAuthContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [coords, setCoords] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [locating, setLocating] = useState(false)

  const persistLocation = (lat, lng) => {
    if (!isAuthenticated) return
    locationService.save({ lat, lng }).catch(() => {})
  }

  const category = searchParams.get('category') || ''
  const femaleCoach = searchParams.get('femaleCoach') === 'true'

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('المتصفح لا يدعم تحديد الموقع')
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
        setGeoError('تعذّر الحصول على موقعك. اسمح بالوصول للموقع أو حاول مجدداً.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const schoolsQuery = useQuery({
    queryKey: ['schools', 'nearby', coords?.lat, coords?.lng, category, femaleCoach],
    queryFn: async () =>
      unwrap(
        await schoolService.getNearby({
          lat: coords.lat,
          lng: coords.lng,
          category: category || undefined,
          femaleCoach: femaleCoach || undefined,
        }),
      ),
    enabled: Boolean(coords?.lat && coords?.lng),
  })

  const schools = Array.isArray(schoolsQuery.data) ? schoolsQuery.data : []

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
    <div dir="rtl">
      <PageHeader
        title="أقرب المدارس"
        description="مدارس مرتّبة حسب المسافة من موقعك الحالي"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={femaleCoach ? 'primary' : 'outline'}
              size="sm"
              onClick={toggleFemaleCoach}
            >
              مدربات إناث
            </Button>
            <Button variant="ghost" size="sm" onClick={retryLocation} disabled={locating}>
              {locating ? 'جاري التحديد...' : 'تحديث الموقع'}
            </Button>
          </div>
        }
      />

      {category && (
        <div className="mb-comfortable">
          <Badge variant="primary">فلتر: رخصة {category}</Badge>
        </div>
      )}

      {geoError && (
        <Card variant="tinted" className="mb-loose !bg-warning-container !text-on-warning-container">
          <p className="text-body-md">{geoError}</p>
          <Button variant="outline" className="mt-4" onClick={retryLocation}>
            إعادة المحاولة
          </Button>
        </Card>
      )}

      <AsyncContent
        isLoading={locating || schoolsQuery.isLoading}
        error={schoolsQuery.error}
        isEmpty={!schools.length && Boolean(coords)}
        emptyIcon="location_off"
        emptyTitle="لا توجد مدارس قريبة"
        emptyDescription="جرّب توسيع نطاق البحث أو إزالة الفلاتر."
      >
        {() => (
<div className="space-y-comfortable">
          {schools.map((school) => (
            <Link key={school._id} to={`/schools/${school._id}`}>
              <Card hoverable>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-headline-sm text-primary">{school.name}</h3>
                      {school.hasFemaleCoaches && (
                        <Badge variant="secondary">مدربات</Badge>
                      )}
                    </div>
                    <p className="flex items-start gap-2 text-body-md text-on-surface-variant">
                      <Icon name="location_on" size={18} className="mt-0.5 shrink-0" />
                      {school.address}
                      {school.governorate && ` — ${school.governorate}`}
                    </p>
                    {school.licenses?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {school.licenses.map((lic) => (
                          <Badge key={lic}>{lic}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {school.distanceKm != null && (
                      <span className="rounded-lg bg-primary-container px-3 py-1 text-label-md font-medium text-on-primary-container">
                        {formatDistance(school.distanceKm)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-label-md text-primary">
                      التفاصيل
                      <Icon name="arrow_back" size={16} />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
