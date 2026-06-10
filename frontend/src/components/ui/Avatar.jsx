import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const Avatar = ({
  src,
  alt = '',
  name,
  size = 'md',
  status = null,
  className = '',
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-label-sm',
    md: 'h-10 w-10 text-label-md',
    lg: 'h-12 w-12 text-headline-sm',
  }

  const initials = name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name || ''}
          className={cn('rounded-xl border border-outline-variant object-cover', sizes[size])}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl bg-surface-container text-primary',
            sizes[size],
          )}
        >
          {initials || <Icon name="person" size={20} />}
        </div>
      )}
      {status === 'online' && (
        <span className="absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-container-lowest bg-success" />
      )}
    </div>
  )
}
