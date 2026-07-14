import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui'
import { resolveMapProvider } from '@/lib/config/maps'
import { SyriaSchoolsMap } from './SyriaSchoolsMap'

const GoogleSchoolsMap = lazy(() =>
  import('./GoogleSchoolsMap').then((m) => ({ default: m.GoogleSchoolsMap })),
)
const MapboxSchoolsMap = lazy(() =>
  import('./MapboxSchoolsMap').then((m) => ({ default: m.MapboxSchoolsMap })),
)

const MapFallback = () => (
  <Skeleton className="h-[min(520px,65vh)] w-full rounded-xl" />
)

export const SchoolsMap = (props) => {
  const provider = resolveMapProvider()

  if (provider === 'google') {
    return (
      <Suspense fallback={<MapFallback />}>
        <GoogleSchoolsMap {...props} />
      </Suspense>
    )
  }

  if (provider === 'mapbox') {
    return (
      <Suspense fallback={<MapFallback />}>
        <MapboxSchoolsMap {...props} />
      </Suspense>
    )
  }

  return <SyriaSchoolsMap {...props} />
}
