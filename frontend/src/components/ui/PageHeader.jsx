import { cn } from '@/lib/cn'
import { Badge } from './Badge'

export const PageHeader = ({
  title,
  description,
  eyebrow,
  breadcrumb,
  actions,
  className = '',
  size = 'lg',
  variant = 'default',
}) => (
  <div
    className={cn(
      'mb-loose flex flex-col gap-4',
      variant === 'default' && 'md:flex-row md:items-end md:justify-between',
      variant === 'compact' && 'gap-3',
      className,
    )}
  >
    <div className="min-w-0">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      {eyebrow && (
        <Badge variant="primary" className="mb-3">
          {eyebrow}
        </Badge>
      )}
      <h1
        className={cn(
          'text-primary',
          size === 'lg' ? 'text-display-lg-mobile md:text-display-lg' : 'text-headline-md',
          variant === 'compact' && 'text-headline-md',
        )}
      >
        {title}
      </h1>
      {description && (
        <p className={cn(
          'mt-2 text-on-surface-variant',
          variant === 'compact' ? 'text-body-md' : 'text-body-lg',
        )}>
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
  </div>
)
