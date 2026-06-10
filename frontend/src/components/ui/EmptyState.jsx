import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Button } from './Button'

export const EmptyState = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => (
  <div className={cn('flex flex-col items-center py-loose text-center', className)}>
    <div className="mb-comfortable flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
      <Icon name={icon} size={32} />
    </div>
    <h3 className="text-headline-sm text-on-surface">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">{description}</p>}
    {actionLabel && onAction && (
      <Button className="mt-comfortable" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
)
