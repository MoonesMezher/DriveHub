import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/components/ui/Icon'
import { notificationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { ROUTES } from '@/lib/constants/routes'

export const NotificationBell = () => {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.list({ limit: 50, unreadOnly: 'true' }).then(unwrap),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const unread = (data?.notifications ?? data?.items ?? []).filter((n) => !n.read).length

  return (
    <Link
      to={ROUTES.NOTIFICATIONS}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low"
      aria-label="الإشعارات"
    >
      <Icon name="notifications" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -start-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-label-sm text-on-error">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
