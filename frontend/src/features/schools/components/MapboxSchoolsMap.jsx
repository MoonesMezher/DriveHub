import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN } from '@/lib/config/maps'
import { SYRIA_CENTER, SYRIA_DEFAULT_ZOOM } from '@/lib/constants/syriaMap'

const formatDistance = (km) => {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export const MapboxSchoolsMap = ({
  schools = [],
  userCoords = null,
  highlightedSchoolId = null,
  onSelectSchool,
  className = '',
}) => {
  const [activeSchoolId, setActiveSchoolId] = useState(null)

  const markers = useMemo(
    () => schools.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)),
    [schools],
  )

  const activeSchool = markers.find((s) => s._id === activeSchoolId)

  return (
    <div
      className={`overflow-hidden rounded-xl border border-outline-variant shadow-sm ${className}`}
      dir="ltr"
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: SYRIA_CENTER[0],
          longitude: SYRIA_CENTER[1],
          zoom: SYRIA_DEFAULT_ZOOM,
        }}
        style={{ width: '100%', height: 'min(520px, 65vh)' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {userCoords?.lat != null && userCoords?.lng != null && (
          <Marker latitude={userCoords.lat} longitude={userCoords.lng} anchor="center">
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-primary bg-primary-container"
              title="موقعك"
            />
          </Marker>
        )}

        {markers.map((school) => {
          const highlighted = school._id === highlightedSchoolId
          return (
            <Marker
              key={school._id}
              latitude={school.lat}
              longitude={school.lng}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                onSelectSchool?.(school._id)
                setActiveSchoolId(school._id)
              }}
            >
              <span
                className={`inline-flex items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md ${
                  highlighted ? 'h-9 w-9 bg-secondary' : 'h-7 w-7 bg-primary'
                }`}
              >
                🚗
              </span>
            </Marker>
          )
        })}

        {activeSchool && (
          <Popup
            latitude={activeSchool.lat}
            longitude={activeSchool.lng}
            anchor="bottom"
            onClose={() => setActiveSchoolId(null)}
            closeOnClick={false}
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
          </Popup>
        )}
      </Map>
    </div>
  )
}
