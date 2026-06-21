import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const Input = ({
  label,
  error,
  hint,
  icon,
  iconPosition = 'start',
  showPasswordToggle = false,
  className = '',
  wrapperClassName = '',
  id,
  type = 'text',
  ...props
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const inputId = id || props.name
  const isPasswordField = type === 'password'
  const canTogglePassword = showPasswordToggle && isPasswordField
  const resolvedType = canTogglePassword ? (passwordVisible ? 'text' : 'password') : type

  const hasStartIcon = Boolean(icon && iconPosition === 'start')
  const hasEndIcon = Boolean(icon && iconPosition === 'end')
  const hasEndToggle = canTogglePassword

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-label-md text-on-surface">
          {label}
        </label>
      )}
      <div className="relative">
        {hasStartIcon && (
          <Icon
            name={icon}
            className="pointer-events-none absolute start-4 top-1/2 z-10 -translate-y-1/2 text-on-surface-variant"
            size={20}
          />
        )}
        <input
          id={inputId}
          type={resolvedType}
          className={cn(
            'h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4',
            'text-body-md text-on-surface placeholder:text-outline',
            'transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            hasStartIcon && 'ps-12',
            (hasEndIcon || hasEndToggle) && 'pe-12',
            error && 'border-error focus:border-error focus:ring-error/20',
            className,
          )}
          {...props}
        />
        {hasEndIcon && !hasEndToggle && (
          <Icon
            name={icon}
            className="pointer-events-none absolute end-4 top-1/2 z-10 -translate-y-1/2 text-on-surface-variant"
            size={20}
          />
        )}
        {hasEndToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute end-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            aria-label={passwordVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            <Icon name={passwordVisible ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        )}
      </div>
      {error && <p className="text-label-sm text-error">{error}</p>}
      {hint && !error && <p className="text-label-sm text-on-surface-variant">{hint}</p>}
    </div>
  )
}
