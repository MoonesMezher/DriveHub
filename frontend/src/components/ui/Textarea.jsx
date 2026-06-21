import { cn } from '@/lib/cn'
import { FormField } from './FormField'

export const Textarea = ({
  label,
  error,
  hint,
  className = '',
  wrapperClassName = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || props.name

  return (
    <FormField label={label} error={error} hint={hint} className={wrapperClassName}>
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3',
          'text-body-md text-on-surface placeholder:text-outline',
          'transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          error && 'border-error focus:border-error focus:ring-error/20',
          className,
        )}
        {...props}
      />
    </FormField>
  )
}
