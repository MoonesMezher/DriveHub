import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiClient, ENDPOINTS } from '@/lib/api'
import { unwrap } from '@/lib/helpers/api'
import { Skeleton } from '@/components/ui'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

export const AdsBanner = ({ placement = 'home', className = '' }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['ads', placement],
    queryFn: async () => unwrap(await apiClient.get(`${ENDPOINTS.ads.list}?placement=${placement}`)),
    staleTime: 5 * 60 * 1000,
  })

  const ads = data?.ads ?? []
  if (isLoading) {
    return (
      <div className={`grid gap-comfortable sm:grid-cols-2 ${className}`}>
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }
  if (!ads.length) return null

  return (
    <section className={className} aria-label="إعلانات">
      <div className="grid gap-comfortable sm:grid-cols-2">
        {ads.map((ad) => {
          const isExternal = ad.link?.startsWith('http')
          const inner = (
            <div className="flex overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low transition-shadow hover:shadow-md">
              {ad.imageUrl && (
                <img
                  src={resolveMediaUrl(ad.imageUrl)}
                  alt=""
                  className="h-28 w-36 shrink-0 object-cover"
                />
              )}
              <div className="flex flex-1 flex-col justify-center p-comfortable">
                <p className="text-headline-sm text-on-surface">{ad.title}</p>
                {ad.link && (
                  <span className="mt-1 text-label-sm text-primary">اعرف المزيد</span>
                )}
              </div>
            </div>
          )
          if (!ad.link) return <div key={ad._id}>{inner}</div>
          if (isExternal) {
            return (
              <a key={ad._id} href={ad.link} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            )
          }
          return (
            <Link key={ad._id} to={ad.link}>
              {inner}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
