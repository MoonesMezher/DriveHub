import { cn } from '@/lib/cn'

export const SectionBlock = ({
  title,
  description,
  actions,
  children,
  align = 'start',
  className = '',
}) => (
  <section className={className}>
    {(title || description || actions) && (
      <div
        className={cn(
          'mb-loose flex flex-wrap items-end gap-4',
          align === 'center' && 'justify-center text-center',
          align === 'between' && 'justify-between',
        )}
      >
        <div className={align === 'center' ? 'w-full' : ''}>
          {title && <h2 className="text-headline-md text-primary">{title}</h2>}
          {description && <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </section>
)

export const PageSection = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: '',
    contained: 'rounded-3xl bg-surface-container p-loose',
    elevated: 'rounded-3xl bg-surface-container-lowest p-loose shadow-card',
  }

  return (
    <section className={cn(variants[variant], className)}>
      {children}
    </section>
  )
}
