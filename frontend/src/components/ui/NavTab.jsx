import { cn } from '@/lib/cn'

export const NavTab = ({
  active,
  children,
  className = '',
  variant = 'underline',
  ...props
}) => {
  const variants = {
    underline: cn(
      'border-b-2 pb-2 transition-colors',
      active ? 'nav-tab-active' : 'border-transparent text-on-surface-variant hover:text-primary',
    ),
    sidebar: cn(
      'rounded-lg px-4 py-2.5 text-label-md transition-colors',
      active ? 'nav-item-active' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
    ),
    settings: cn(
      'rounded-lg px-4 py-3 text-label-md transition-colors',
      active ? 'settings-tab-active' : 'text-on-surface-variant hover:bg-surface-container-low',
    ),
  }

  return (
    <button
      type="button"
      className={cn(variants[variant], className)}
      aria-selected={active}
      {...props}
    >
      {children}
    </button>
  )
}
