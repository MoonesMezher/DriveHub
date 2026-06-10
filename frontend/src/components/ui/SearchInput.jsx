import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const SearchInput = ({ className = '', placeholder = 'بحث...', ...props }) => (
  <div className={cn('relative w-full', className)}>
    <Icon
      name="search"
      className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-outline"
      size={20}
    />
    <input
      type="search"
      placeholder={placeholder}
      className={cn(
        'w-full rounded-xl border-none bg-surface-container-low py-2.5 pe-10 ps-4',
        'text-label-md text-on-surface placeholder:text-outline',
        'focus:ring-2 focus:ring-ultra-secondary/30 focus:outline-none',
      )}
      {...props}
    />
  </div>
)
