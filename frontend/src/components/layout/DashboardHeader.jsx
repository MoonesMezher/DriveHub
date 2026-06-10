import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { SearchInput } from '@/components/ui/SearchInput'
import { Avatar } from '@/components/ui/Avatar'
import { Divider } from '@/components/ui/Divider'
import { NotificationBell } from './NotificationBell'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { ROUTES } from '@/lib/constants/routes'

export const DashboardHeader = ({
  showSearch = true,
  searchPlaceholder = 'بحث...',
  className = '',
}) => {
  const { user, activeRole } = useAuth()

  return (
    <header
      className={cn(
        'glass-header fixed start-0 end-64 top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant px-gutter',
        className,
      )}
    >
      {showSearch && (
        <div className="max-w-lg flex-1">
          <SearchInput placeholder={searchPlaceholder} />
        </div>
      )}
      <div className="flex items-center gap-3">
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
