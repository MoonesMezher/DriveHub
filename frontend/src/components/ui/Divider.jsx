import { cn } from '@/lib/cn'

export const Divider = ({ className = '', vertical = false }) => (
  <div
    className={cn(
      vertical ? 'mx-1 h-6 w-px bg-outline-variant' : 'my-4 h-px w-full bg-outline-variant',
      className,
    )}
    role="separator"
  />
)
