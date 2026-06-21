import { cn } from '@/lib/cn'

export const Checkbox = ({
  label,
  description,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || props.name

  return (
    <label
      htmlFor={checkboxId}
      className={cn('flex cursor-pointer items-start gap-3', className)}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary/20"
        {...props}
      />
      <span>
        {label && <span className="text-label-md text-on-surface">{label}</span>}
        {description && <span className="mt-0.5 block text-label-sm text-on-surface-variant">{description}</span>}
      </span>
    </label>
  )
}
