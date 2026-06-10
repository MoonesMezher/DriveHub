import { cn } from '@/lib/cn'

const variants = {
  default: 'bg-surface-container-lowest border border-outline-variant shadow-card',
  glass: 'glass-card shadow-glass',
  elevated: 'bg-surface-container-lowest shadow-elevated',
  tinted: 'bg-primary-container text-on-primary-container shadow-md',
}

const paddings = {
  none: '',
  sm: 'p-compact',
  md: 'p-comfortable',
  lg: 'p-loose',
}

export const Card = ({
  title,
  description,
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  headerAction,
}) => (
  <div
    className={cn(
      'rounded-xl',
      variants[variant],
      paddings[padding],
      hoverable && 'transition-lift cursor-pointer',
      className,
    )}
  >
    {(title || headerAction) && (
      <div className={cn('flex items-start justify-between gap-4', children && 'mb-4 border-b border-outline-variant/50 pb-4')}>
        <div>
          {title && <h3 className="text-headline-sm text-primary">{title}</h3>}
          {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
        </div>
        {headerAction}
      </div>
    )}
    {children}
  </div>
)
