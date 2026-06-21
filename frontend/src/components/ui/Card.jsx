import { cn } from '@/lib/cn'

const variants = {
  default: 'bg-surface-container-lowest border border-outline-variant shadow-card',
  glass: 'glass-card shadow-glass',
  elevated: 'bg-surface-container-lowest shadow-elevated',
  tinted: 'bg-primary-container text-on-primary-container shadow-md',
  interactive: 'bg-surface-container-lowest border border-outline-variant shadow-card cursor-pointer transition-lift',
}

const sizes = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
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
  size = 'md',
  padding = 'md',
  hoverable = false,
  media,
  className = '',
  headerAction,
  onClick,
}) => {
  const resolvedVariant = hoverable ? 'interactive' : variant
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        sizes[size],
        variants[resolvedVariant],
        paddings[padding],
        onClick && 'w-full text-start',
        className,
      )}
    >
      {media}
      {(title || headerAction) && (
        <div className={cn('flex items-start justify-between gap-4', children && 'mb-4 border-b border-outline-variant/50 pb-4')}>
          <div>
            {title && (
              <h3 className={cn(
                'text-headline-sm',
                variant === 'tinted' ? 'text-on-primary-container' : 'text-primary',
              )}>
                {title}
              </h3>
            )}
            {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </Tag>
  )
}
