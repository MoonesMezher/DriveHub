import { cn } from '@/lib/cn'

export const Icon = ({ name, className = '', filled = false, size = 24, ...props }) => (
  <span
    className={cn('material-symbols-outlined', filled && 'fill', className)}
    style={{ fontSize: size }}
    aria-hidden="true"
    {...props}
  >
    {name}
  </span>
)
