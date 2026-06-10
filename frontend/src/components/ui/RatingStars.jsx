import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const RatingStars = ({ value = 0, onChange, max = 5, size = 28, readOnly = false }) => (
  <div className="flex gap-1" role="group" aria-label="التقييم">
    {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
      <button
        key={star}
        type="button"
        disabled={readOnly}
        onClick={() => onChange?.(star)}
        className={cn('rating-star', star <= value && 'active', readOnly && 'cursor-default')}
        aria-label={`${star} من ${max}`}
      >
        <Icon name="star" size={size} filled={star <= value} />
      </button>
    ))}
  </div>
)
