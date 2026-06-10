import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  className = '',
}) => (
  <div
    className={cn(
      'rounded-xl border border-outline-variant bg-surface-container-lowest p-comfortable shadow-card',
      className,
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="mt-1 text-headline-sm text-on-surface">{value}</p>
        {trendLabel && (
          <p className={cn('mt-1 text-label-sm', trend === 'up' ? 'text-success' : 'text-error')}>
            {trendLabel}
          </p>
        )}
      </div>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
          <Icon name={icon} size={22} />
        </div>
      )}
    </div>
  </div>
)
