import { cn } from '@/lib/cn'
import { FormField } from './FormField'

export const Select = ({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}) => {
  const selectId = id || props.name

  return (
    <FormField label={label} error={error} hint={hint} className={wrapperClassName}>
      <select
        id={selectId}
        className={cn(
          'h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4',
          'text-body-md text-on-surface',
          'transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          error && 'border-error focus:border-error focus:ring-error/20',
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
