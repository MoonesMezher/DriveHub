import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  SYRIA_BOUNDS,
  SYRIA_CENTER,
  SYRIA_DEFAULT_ZOOM,
  SYRIA_MAX_BOUNDS,
  SYRIA_MAX_ZOOM,
  SYRIA_MIN_ZOOM,
} from '@/lib/constants/syriaMap'

const formatDistance = (km) => {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

const createSchoolIcon = (selected) =>
  L.divIcon({
    className: '',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${selected ? 34 : 28}px;height:${selected ? 34 : 28}px;
      border-radius:50%;
      background:${selected ? '#fea619' : '#00236f'};
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,35,111,0.35);
      color:#fff;font-size:${selected ? 16 : 14}px;font-weight:700;
      transition:transform 0.15s ease;
      transform:${selected ? 'scale(1.15)' : 'scale(1)'};
      z-index:${selected ? 1000 : 1};
    ">🚗</span>`,
    iconSize: [selected ? 34 : 28, selected ? 34 : 28],
    iconAnchor: [selected ? 17 : 14, selected ? 17 : 14],
    popupAnchor: [0, -16],
  })

const FitSyriaBounds = () => {
  const map = useMap()

  useEffect(() => {
    const fit = () => {
      map.fitBounds(SYRIA_BOUNDS, {
        padding: [20, 20],
        maxZoom: 7,
        animate: false,
      })
    }

    fit()
    map.setMaxBounds(SYRIA_MAX_BOUNDS)

    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [map])

  return null
}

export const SyriaSchoolsMap = ({
  schools = [],
  userCoords = null,
  highlightedSchoolId = null,
  onSelectSchool,
  className = '',
}) => {
  const markers = useMemo(
    () => schools.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)),
    [schools],
  )

  return (
    <div
      className={`overflow-hidden rounded-xl border border-outline-variant shadow-sm ${className}`}
      dir="ltr"
    >
      <MapContainer
        center={SYRIA_CENTER}
        zoom={SYRIA_DEFAULT_ZOOM}
        minZoom={SYRIA_MIN_ZOOM}
        maxZoom={SYRIA_MAX_ZOOM}
        maxBounds={SYRIA_MAX_BOUNDS}
        maxBoundsViscosity={0.9}
        scrollWheelZoom
        className="z-0 h-[min(520px,65vh)] w-full"
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitSyriaBounds />

        {userCoords?.lat != null && userCoords?.lng != null && (
          <CircleMarker
            center={[userCoords.lat, userCoords.lng]}
            radius={9}
            pathOptions={{
              color: '#00236f',
              fillColor: '#1e3a8a',
              fillOpacity: 0.85,
              weight: 3,
            }}
          >
            <Popup>
              <div dir="rtl" className="min-w-[140px] text-sm">
                <strong>موقعك الحالي</strong>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {markers.map((school) => {
          const highlighted = school._id === highlightedSchoolId
          return (
            <Marker
              key={school._id}
              position={[school.lat, school.lng]}
              icon={createSchoolIcon(highlighted)}
              zIndexOffset={highlighted ? 1000 : 0}
              eventHandlers={{
                click: () => onSelectSchool?.(school._id),
              }}
            >
              <Popup>
                <div dir="rtl" className="min-w-[200px] space-y-2 text-sm text-on-surface">
                  <p className="text-base font-semibold text-primary">{school.name}</p>
                  <p className="text-on-surface-variant">
                    {school.address}
                    {school.governorate ? ` — ${school.governorate}` : ''}
                  </p>
                  {school.distanceKm != null && (
                    <p className="font-medium text-primary-container">
                      المسافة: {formatDistance(school.distanceKm)}
                    </p>
                  )}
                  {school.licenses?.length > 0 && (
                    <p className="text-label-md text-on-surface-variant">
                      الرخص: {school.licenses.join('، ')}
                    </p>
                  )}
                  {school.hasFemaleCoaches && (
                    <span className="inline-block rounded bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container">
                      مدربات إناث
                    </span>
                  )}
                  <Link
                    to={`/schools/${school._id}`}
                    className="mt-1 inline-block font-medium text-primary hover:underline"
                  >
                    عرض التفاصيل ←
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
