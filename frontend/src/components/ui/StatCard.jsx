import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Card } from './Card'
import { formatNumber } from '@/lib/helpers/format'

const displayValue = (value) => {
  if (value == null || value === '—') return value ?? '—'
  if (typeof value === 'number') return formatNumber(value)
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return formatNumber(Number(value))
  }
  return value
}

export const StatCard = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  className = '',
}) => (
  <Card padding="md" className={className}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-label-sm text-on-surface-variant">{label}</p>
        <p className="mt-1 text-headline-sm text-on-surface">{displayValue(value)}</p>
        {trendLabel && (
          <p className={cn('mt-1 text-label-sm', trend === 'up' ? 'text-success' : 'text-error')}>
            {trendLabel}
          </p>
        )}
      </div>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-primary">
          <Icon name={icon} size={22} />
        </div>
      )}
    </div>
  </Card>
)
