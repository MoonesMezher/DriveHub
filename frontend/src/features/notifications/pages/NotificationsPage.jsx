import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, Card, Button, Badge, AsyncContent, Icon, EmptyState } from '@/components/ui'
import { notificationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { fromNow } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/cn'

const TYPE_ICONS = {
  enrollment_accepted: 'check_circle',
  enrollment_rejected: 'cancel',
  enrollment_waitlist: 'hourglass_top',
  enrollment_request: 'person_add',
  payment_reminder: 'schedule',
  payment_expired: 'schedule',
  course_launch: 'school',
  exam_scheduled: 'event',
  exam_reminder: 'event',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      toast.success('تم تعليم جميع الإشعارات كمقروءة')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const items = data?.notifications ?? data?.items ?? []
  const unread = items.filter((n) => !n.read).length

  return (
    <div dir="rtl">
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

      <AsyncContent isLoading={isLoading} error={error} isEmpty={false}>
        {() =>
          !items.length ? (
            <Card>
              <EmptyState
                icon="notifications"
                title="لا توجد إشعارات"
                description="ستظهر هنا تنبيهات الاشتراك والدفع والامتحانات"
                variant="card"
              />
            </Card>
          ) : (
            <div className="relative">
              <div className="absolute start-6 top-2 bottom-2 w-px bg-outline-variant" aria-hidden />

              <div className="space-y-comfortable">
                {items.map((n) => (
                  <div key={n._id} className="relative flex gap-comfortable ps-14">
                    <div
                      className={cn(
                        'absolute start-4 top-6 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2',
                        !n.read
                          ? 'border-primary bg-primary'
                          : 'border-outline-variant bg-surface-container-lowest',
                      )}
                      aria-hidden
                    >
                      {!n.read && <span className="h-2 w-2 rounded-full bg-on-primary" />}
                    </div>

                    <Card
                      className={cn(
                        'flex-1',
                        !n.read && 'border-primary/30 bg-primary/5 shadow-md',
                      )}
                      headerAction={
                        !n.read && (
                          <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n._id)}>
                            تعليم كمقروء
                          </Button>
                        )
                      }
                    >
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                            !n.read
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-surface-container text-on-surface-variant',
                          )}
                        >
                          <Icon name={TYPE_ICONS[n.type] || 'notifications'} size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={cn(
                                'text-headline-sm',
                                !n.read ? 'text-primary' : 'text-on-surface',
                              )}
                            >
                              {n.title}
                            </h3>
                            {!n.read && <Badge variant="primary">جديد</Badge>}
                          </div>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            {n.message || n.body}
                          </p>

                          {n.suggestions?.length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {n.suggestions.map((s) => (
                                <Card
                                  key={s}
                                  variant="tinted"
                                  padding="sm"
                                  hoverable
                                  className="!bg-primary-container/60"
                                >
                                  <Link
                                    to={ROUTES.SCHOOLS_NEARBY}
                                    className="flex items-center gap-2 text-label-md text-on-primary-container hover:underline"
                                  >
                                    <Icon name="location_on" size={18} />
                                    {s}
                                  </Link>
                                </Card>
                              ))}
                            </div>
                          )}

                          <p className="mt-2 text-label-sm text-on-surface-variant">
                            {fromNow(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )
        }
      </AsyncContent>
    </div>
  )
}
