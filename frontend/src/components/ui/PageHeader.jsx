import { cn } from '@/lib/cn'

export const PageHeader = ({
  title,
  description,
  actions,
  className = '',
  size = 'lg',
}) => (
  <div className={cn('mb-loose flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
    <div>
      <h1
        className={cn(
          'text-primary',
          size === 'lg' ? 'text-display-lg-mobile md:text-display-lg' : 'text-headline-md',
        )}
      >
        {title}
      </h1>
      {description && <p className="mt-2 text-body-lg text-on-surface-variant">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
)
