import { useQuery } from '@tanstack/react-query'
import { Icon, Skeleton } from '@/components/ui'
import { TESTIMONIALS } from '@/lib/constants/homeVisuals'
import { SectionBlock } from '@/components/ui'
import { testimonialService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

const getInitial = (name) => (name?.trim()?.[0] || '؟')

const mapApiItems = (items = []) =>
  items.map((item) => ({
    id: item._id,
    name: item.name,
    text: item.quote,
    role: item.role,
    rating: item.rating,
    initial: getInitial(item.name),
    avatar: resolveMediaUrl(item.avatar),
  }))

const StarRating = ({ rating = 5 }) => (
  <div className="flex items-center gap-1 text-secondary">
    {[1, 2, 3, 4, 5].map((n) => (
      <Icon
        key={n}
        name="star"
        size={20}
        className={n <= rating ? 'rating-star active' : 'rating-star opacity-30'}
      />
    ))}
  </div>
)

export const TestimonialsRow = () => {
  const testimonialsQuery = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => testimonialService.list().then(unwrap),
    staleTime: 60_000,
  })

  const apiItems = testimonialsQuery.data?.items ?? []
  const testimonials = apiItems.length > 0
    ? mapApiItems(apiItems)
    : TESTIMONIALS.map((t, index) => ({ ...t, id: `fallback-${index}` }))

  const avgRating = testimonials.some((t) => t.rating)
    ? Math.round(
      testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / testimonials.length,
    )
    : 5

  return (
    <SectionBlock
      title="ماذا يقول المتعلّمون"
      actions={<StarRating rating={avgRating} />}
    >
      {testimonialsQuery.isLoading ? (
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {testimonials.map((t) => (
            <div
              key={t.id || t.name}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-comfortable shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                {t.avatar ? (
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-label-md font-bold text-on-primary-container">
                    {t.initial}
                  </div>
                )}
                <div>
                  <span className="block text-label-md font-semibold text-on-surface">{t.name}</span>
                  {t.role && (
                    <span className="text-body-sm text-on-surface-variant">{t.role}</span>
                  )}
                </div>
              </div>
              {t.rating && (
                <div className="mb-2">
                  <StarRating rating={t.rating} />
                </div>
              )}
              <p className="text-body-md text-on-surface-variant">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>
  )
}
