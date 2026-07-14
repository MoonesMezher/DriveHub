import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, MarkerF, CircleF, InfoWindowF } from '@react-google-maps/api'
import { GOOGLE_MAPS_KEY } from '@/lib/config/maps'
import { SYRIA_CENTER, SYRIA_DEFAULT_ZOOM } from '@/lib/constants/syriaMap'

const formatDistance = (km) => {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

const mapContainerStyle = {
  width: '100%',
  height: 'min(520px, 65vh)',
}

export const GoogleSchoolsMap = ({
  schools = [],
  userCoords = null,
  highlightedSchoolId = null,
  onSelectSchool,
  className = '',
}) => {
  const [activeSchoolId, setActiveSchoolId] = useState(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  })

  const markers = useMemo(
    () => schools.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)),
    [schools],
  )

  const activeSchool = markers.find((s) => s._id === activeSchoolId)

  if (!isLoaded) {
    return (
      <div className={`flex h-[min(520px,65vh)] items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low ${className}`}>
        <p className="text-body-md text-on-surface-variant">جاري تحميل الخريطة...</p>
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-outline-variant shadow-sm ${className}`}
      dir="ltr"
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: SYRIA_CENTER[0], lng: SYRIA_CENTER[1] }}
        zoom={SYRIA_DEFAULT_ZOOM}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {userCoords?.lat != null && userCoords?.lng != null && (
          <CircleF
            center={{ lat: userCoords.lat, lng: userCoords.lng }}
            radius={120}
            options={{
              strokeColor: '#00236f',
              fillColor: '#1e3a8a',
              fillOpacity: 0.35,
              strokeWeight: 2,
            }}
          />
        )}

        {markers.map((school) => (
          <MarkerF
            key={school._id}
            position={{ lat: school.lat, lng: school.lng }}
            onClick={() => {
              onSelectSchool?.(school._id)
              setActiveSchoolId(school._id)
            }}
            icon={
              school._id === highlightedSchoolId
                ? 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
          />
        ))}

        {activeSchool && (
          <InfoWindowF
            position={{ lat: activeSchool.lat, lng: activeSchool.lng }}
            onCloseClick={() => setActiveSchoolId(null)}
          >
            <div dir="rtl" className="min-w-[200px] space-y-2 text-sm text-on-surface">
              <p className="text-base font-semibold text-primary">{activeSchool.name}</p>
              <p className="text-on-surface-variant">
                {activeSchool.address}
                {activeSchool.governorate ? ` — ${activeSchool.governorate}` : ''}
              </p>
              {activeSchool.distanceKm != null && (
                <p className="font-medium">المسافة: {formatDistance(activeSchool.distanceKm)}</p>
              )}
              <Link
                to={`/schools/${activeSchool._id}`}
                className="inline-block font-medium text-primary hover:underline"
              >
                عرض التفاصيل ←
              </Link>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  )
}
