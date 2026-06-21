import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'

export const SidebarNavItem = ({ to, icon, label, variant = 'default', onClick, end = false }) => {
  const base = 'mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-label-md transition-all'

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary w-[calc(100%-1.5rem)]')}>
        <Icon name={icon} size={20} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          base,
          isActive
            ? variant === 'ultra'
              ? 'nav-item-active-ultra font-semibold'
              : 'nav-item-active font-medium'
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
        )
      }
    >
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </NavLink>
  )
}
