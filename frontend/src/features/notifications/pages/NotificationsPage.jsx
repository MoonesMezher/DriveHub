import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, Card, Button, Badge, AsyncContent, Icon } from '@/components/ui'
import { notificationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { fromNow } from '@/lib/helpers/date'

const TYPE_ICONS = {
  enrollment_accepted: 'check_circle',
  enrollment_rejected: 'cancel',
  payment_expired: 'schedule',
  course_launch: 'school',
  exam_scheduled: 'event',
  exam_result: 'fact_check',
  waitlist_promoted: 'trending_up',
  content_approved: 'verified',
  roster_submitted: 'upload_file',
  general: 'notifications',
}

export const NotificationsPage = () => {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list({ limit: 50 }).then(unwrap),
  })

  const markRead = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('تم تعليم جميع الإشعارات كمقروءة')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const items = data?.items || []
  const unread = items.filter((n) => !n.read).length

  return (
    <div>
      <PageHeader
        title="الإشعارات"
        description={unread > 0 ? `لديك ${unread} إشعار غير مقروء` : 'جميع إشعاراتك في مكان واحد'}
        actions={
          unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              تعليم الكل كمقروء
            </Button>
          )
        }
      />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!items.length}
        emptyIcon="notifications"
        emptyTitle="لا توجد إشعارات"
        emptyDescription="ستظهر هنا تنبيهات الاشتراك والدفع والامتحانات"
      >
        {() => (
<div className="flex flex-col gap-3">
          {items.map((n) => (
            <Card
              key={n._id}
              className={!n.read ? 'border-primary/30 bg-primary/5' : ''}
              hoverable={!n.read}
              headerAction={
                !n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n._id)}>
                    تعليم كمقروء
                  </Button>
                )
              }
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary">
                  <Icon name={TYPE_ICONS[n.type] || 'notifications'} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-headline-sm text-on-surface">{n.title}</h3>
                    {!n.read && <Badge variant="primary">جديد</Badge>}
                  </div>
                  <p className="mt-1 text-body-md text-on-surface-variant">{n.message || n.body}</p>
                  <p className="mt-2 text-label-sm text-on-surface-variant">{fromNow(n.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
