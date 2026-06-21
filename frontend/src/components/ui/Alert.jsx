import { cn } from '@/lib/cn'
import { Icon } from './Icon'

const variants = {
  info: 'bg-surface-container border-outline-variant text-on-surface',
  success: 'bg-success-container border-success/20 text-on-success-container',
  warning: 'bg-warning-container border-warning/20 text-on-warning-container',
  error: 'bg-error-container border-error/20 text-on-error-container',
}

const icons = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

export const Alert = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => (
  <div
    role="alert"
    className={cn(
      'flex gap-3 rounded-xl border p-comfortable',
      variants[variant],
      className,
    )}
  >
    <Icon name={icons[variant]} size={22} className="shrink-0" />
    <div className="min-w-0 flex-1">
      {title && <p className="text-label-md font-semibold">{title}</p>}
      {children && <div className={cn('text-body-md', title && 'mt-1')}>{children}</div>}
    </div>
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 transition-colors hover:bg-black/5"
        aria-label="إغلاق"
      >
        <Icon name="close" size={18} />
      </button>
    )}
  </div>
)
