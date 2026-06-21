import { cn } from '@/lib/cn'

const variants = {
  default: 'bg-surface-container-high text-on-surface-variant',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary-container/20 text-secondary',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  error: 'bg-error-container text-on-error-container',
  active: 'bg-primary !text-white',
}

export const Badge = ({ children, variant = 'default', className = '', dot = false }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-sm',
      variants[variant],
      className,
    )}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
)
