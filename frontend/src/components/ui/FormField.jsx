import { cn } from '@/lib/cn'

export const FormField = ({ label, error, hint, required, children, className = '' }) => (
  <div className={cn('space-y-2', className)}>
    {label && (
      <label className="block text-label-md text-on-surface">
        {label}
        {required && <span className="ms-1 text-error">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-label-sm text-error">{error}</p>}
    {hint && !error && <p className="text-label-sm text-on-surface-variant">{hint}</p>}
  </div>
)

export const FormSection = ({
  title,
  description,
  children,
  className = '',
}) => (
  <section className={cn('space-y-comfortable', className)}>
    {(title || description) && (
      <div className="border-b border-outline-variant/50 pb-comfortable">
        {title && <h3 className="text-headline-sm text-primary">{title}</h3>}
        {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
      </div>
    )}
    <div className="space-y-comfortable">{children}</div>
  </section>
)
