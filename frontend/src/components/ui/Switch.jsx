import { cn } from '@/lib/cn'

export const Switch = ({
  label,
  description,
  checked,
  onChange,
  className = '',
  id,
  disabled,
}) => {
  const switchId = id || label

  return (
    <label
      htmlFor={switchId}
      className={cn('flex cursor-pointer items-center justify-between gap-4', disabled && 'opacity-50', className)}
    >
      <span>
        {label && <span className="text-label-md text-on-surface">{label}</span>}
        {description && <span className="mt-0.5 block text-label-sm text-on-surface-variant">{description}</span>}
      </span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-standard',
          checked ? 'bg-primary' : 'bg-outline-variant',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-standard',
            checked ? 'end-0.5' : 'start-0.5',
          )}
        />
      </button>
    </label>
  )
}
