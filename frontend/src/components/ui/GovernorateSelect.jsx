import { cn } from '@/lib/cn'
import { SYRIAN_GOVERNORATES } from '@/lib/constants/syrianGovernorates'

export const GovernorateSelect = ({
  label = 'المحافظة',
  value = '',
  onChange,
  name = 'governorate',
  id,
  required = false,
  error,
  hint,
  placeholder = '— اختر المحافظة —',
  allowEmpty = true,
  className = '',
  wrapperClassName = '',
}) => {
  const selectId = id || name

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      {label && (
        <label htmlFor={selectId} className="block text-label-md text-on-surface">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={cn(
          'h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4',
          'text-body-md text-on-surface',
          'transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          error && 'border-error focus:ring-error/20',
          className,
        )}
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {SYRIAN_GOVERNORATES.map((gov) => (
          <option key={gov} value={gov}>
            {gov}
          </option>
        ))}
      </select>
      {error && <p className="text-label-sm text-error">{error}</p>}
      {hint && !error && <p className="text-label-sm text-on-surface-variant">{hint}</p>}
    </div>
  )
}
