import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Avatar, Button, Divider, Drawer, Icon } from '@/components/ui'
import { NotificationBell } from './NotificationBell'
import { GlobalSearch } from './GlobalSearch'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { ROUTES } from '@/lib/constants/routes'

export const DashboardHeader = ({
  showSearch = true,
  className = '',
  onMenuOpen,
}) => {
  const { user, activeRole } = useAuth()

  return (
    <header
      className={cn(
        'glass-header fixed start-0 end-0 top-0 z-30 flex h-16 items-center justify-between gap-4 overflow-visible border-b border-outline-variant/80 px-gutter md:end-[var(--width-sidebar)]',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuOpen}
          aria-label="فتح القائمة"
        >
          <Icon name="menu" size={24} />
        </Button>
        {showSearch && (
          <div className="min-w-0 max-w-xl flex-1">
            <GlobalSearch />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <NotificationBell />
        <Divider vertical />
        <Link to={ROUTES.PROFILE} className="flex items-center gap-3 ps-2 transition-opacity hover:opacity-80">
          <div className="hidden text-end lg:block">
            <p className="text-label-md font-bold text-on-surface">{user?.name}</p>
            <p className="text-label-sm text-on-surface-variant">
              {ROLE_LABELS[activeRole] || activeRole}
            </p>
          </div>
          <Avatar name={user?.name} status="online" />
        </Link>
      </div>
    </header>
  )
}

export const DashboardHeaderWithDrawer = ({ sidebar, ...props }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <>
      <DashboardHeader {...props} onMenuOpen={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="القائمة">
        {sidebar}
      </Drawer>
    </>
  )
}
