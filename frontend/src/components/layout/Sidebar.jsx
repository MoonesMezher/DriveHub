import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { SidebarNavItem } from './SidebarNavItem'

export const Sidebar = ({
  title = 'DriveHub',
  subtitle,
  logoIcon = 'drive_eta',
  items = [],
  footerItems = [],
  cta,
  variant = 'default',
  className = '',
}) => (
  <aside
    className={cn(
      'fixed end-0 top-0 z-40 hidden h-screen w-64 flex-col border-s border-outline-variant bg-surface-container-lowest shadow-sm md:flex',
      className,
    )}
  >
    <div className="flex items-center gap-3 px-6 py-stack-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <Icon name={logoIcon} className="text-on-primary" size={22} />
      </div>
      <div>
        <h1 className="text-headline-sm tracking-tight text-primary">{title}</h1>
        {subtitle && <p className="text-label-sm text-on-surface-variant">{subtitle}</p>}
      </div>
    </div>

    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto custom-scrollbar">
      {items.map((item) => (
        <SidebarNavItem key={item.to || item.label} {...item} variant={variant} />
      ))}
    </nav>

    {cta && (
      <div className="px-4 pb-4">
        {cta.to ? (
          <Link to={cta.to}>
            <Button variant={variant === 'ultra' ? 'ultra' : 'secondary'} className="w-full">
              <Icon name={cta.icon || 'add_circle'} size={20} />
              {cta.label}
            </Button>
          </Link>
        ) : (
          <Button variant={variant === 'ultra' ? 'ultra' : 'secondary'} className="w-full" onClick={cta.onClick}>
            <Icon name={cta.icon || 'add_circle'} size={20} />
            {cta.label}
          </Button>
        )}
      </div>
    )}

    {footerItems.length > 0 && (
      <div className="border-t border-outline-variant px-2 py-4">
        {footerItems.map((item) => (
          <SidebarNavItem key={item.to || item.label} {...item} variant={variant} />
        ))}
      </div>
    )}
  </aside>
)
