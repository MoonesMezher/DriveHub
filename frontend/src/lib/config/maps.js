/**
 * Map provider configuration.
 * Set VITE_MAP_PROVIDER to `google` | `mapbox` | `leaflet` (default).
 * Falls back to Leaflet when the chosen provider has no API key/token.
 */
export const MAP_PROVIDER = (import.meta.env.VITE_MAP_PROVIDER || 'leaflet').toLowerCase()
export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export const resolveMapProvider = () => {
  if (MAP_PROVIDER === 'google' && GOOGLE_MAPS_KEY) return 'google'
  if (MAP_PROVIDER === 'mapbox' && MAPBOX_TOKEN) return 'mapbox'
  return 'leaflet'
}

export const mapProviderLabel = () => {
  const p = resolveMapProvider()
  if (p === 'google') return 'Google Maps'
  if (p === 'mapbox') return 'Mapbox'
  return 'OpenStreetMap (Leaflet)'
}
