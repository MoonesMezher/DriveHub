import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import {
  PageHeader,
  AsyncContent,
  Card,
  Badge,
  Button,
  Icon,
  Input,
  Dialog,
  ConfirmDialog,
} from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const statusVariant = (status, confirmed) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'error'
  if (status === 'scheduled' && confirmed) return 'success'
  return 'primary'
}

const statusLabel = (lesson) => {
  if (lesson.status === 'scheduled' && lesson.confirmed) {
    return LESSON_STATUS_LABELS.confirmed
  }
  return LESSON_STATUS_LABELS[lesson.status] ?? lesson.status
}

const groupByWeek = (schedule) => {
  const weeks = {}
  schedule.forEach((lesson) => {
    const weekStart = dayjs(lesson.scheduledAt).startOf('week').format('YYYY-MM-DD')
    if (!weeks[weekStart]) weeks[weekStart] = []
    weeks[weekStart].push(lesson)
  })
  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, lessons]) => ({
      weekStart,
      weekEnd: dayjs(weekStart).endOf('week').format('YYYY-MM-DD'),
      lessons: lessons.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    }))
}

const toDateTimeLocal = (value) => dayjs(value).format('YYYY-MM-DDTHH:mm')

export const CoachSchedulePage = () => {
  const queryClient = useQueryClient()
  const [cancelTarget, setCancelTarget] = useState(null)
  const [postponeTarget, setPostponeTarget] = useState(null)
  const [postponeAt, setPostponeAt] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['coach', 'schedule'],
    queryFn: async () => unwrap(await coachService.schedule()),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['coach', 'schedule'] })
    queryClient.invalidateQueries({ queryKey: ['coach', 'lessons'] })
  }

  const cancelMutation = useMutation({
    mutationFn: (id) => coachService.cancelLesson(id),
    onSuccess: () => {
      toast.success('تم إلغاء الموعد')
      setCancelTarget(null)
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const confirmMutation = useMutation({
    mutationFn: (id) => coachService.confirmLesson(id),
    onSuccess: () => {
      toast.success('تم تأكيد الموعد')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const postponeMutation = useMutation({
    mutationFn: ({ id, scheduledAt }) => coachService.postponeLesson(id, { scheduledAt }),
    onSuccess: () => {
      toast.success('تم تأجيل الموعد')
      setPostponeTarget(null)
      setPostponeAt('')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const schedule = data?.schedule ?? []
  const weekGroups = useMemo(() => groupByWeek(schedule), [schedule])

  const openPostpone = (lesson) => {
    setPostponeTarget(lesson)
    setPostponeAt(toDateTimeLocal(dayjs(lesson.scheduledAt).add(1, 'day')))
  }

  const submitPostpone = () => {
    if (!postponeTarget || !postponeAt) {
      toast.error('يرجى اختيار الموعد الجديد')
      return
    }
    postponeMutation.mutate({
      id: postponeTarget._id,
      scheduledAt: new Date(postponeAt).toISOString(),
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="جدول المواعيد"
        description="كل مواعيدك مع إجراءات الإلغاء أو التأجيل أو التأكيد"
        actions={
          <Link to={`${ROUTES.COACH}/lessons`}>
            <Button variant="secondary">تقييم درس</Button>
          </Link>
        }
      />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!schedule.length}
        emptyIcon="calendar_month"
        emptyTitle="لا توجد مواعيد"
        emptyDescription="ستظهر مواعيد الدروس هنا عند حجزها"
      >
        {() => (
          <div className="space-y-loose">
            {weekGroups.map(({ weekStart, weekEnd, lessons }) => (
              <Card
                key={weekStart}
                title={`أسبوع ${dayjs(weekStart).format('D MMM')} — ${dayjs(weekEnd).format('D MMM YYYY')}`}
              >
                <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
                  {lessons.map((lesson) => {
                    const canManage = lesson.status === 'scheduled'
                    return (
                      <div
                        key={lesson._id}
                        className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-comfortable"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon name="event" size={18} className="text-primary" />
                            <span className="text-label-md text-on-surface">
                              {dayjs(lesson.scheduledAt).format('dddd D/M')}
                            </span>
                          </div>
                          <Badge variant={statusVariant(lesson.status, lesson.confirmed)}>
                            {statusLabel(lesson)}
                          </Badge>
                        </div>
                        <p className="text-headline-sm text-on-surface">
                          {dayjs(lesson.scheduledAt).format('HH:mm')}
                        </p>
                        <p className="mt-1 text-body-md text-on-surface-variant">
                          {lesson.studentId?.name ?? '—'}
                        </p>
                        {lesson.durationMinutes && (
                          <p className="mt-1 text-label-sm text-on-surface-variant">
                            {lesson.durationMinutes} دقيقة
                          </p>
                        )}
                        <p className="mt-2 text-label-sm text-on-surface-variant">
                          {formatDateTime(lesson.scheduledAt)}
                        </p>

                        {canManage && (
                          <div className="mt-comfortable flex flex-wrap gap-2">
                            {!lesson.confirmed && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => confirmMutation.mutate(lesson._id)}
                                disabled={confirmMutation.isPending}
                              >
                                تأكيد
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openPostpone(lesson)}
                            >
                              تأجيل
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelTarget(lesson)}
                            >
                              إلغاء
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="إلغاء الموعد"
        message={`هل تريد إلغاء موعد ${cancelTarget?.studentId?.name || 'الطالب'}؟`}
        confirmLabel={cancelMutation.isPending ? 'جاري الإلغاء…' : 'تأكيد الإلغاء'}
        cancelLabel="رجوع"
        variant="danger"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget._id)}
      />

      <Dialog open={Boolean(postponeTarget)} onClose={() => setPostponeTarget(null)} size="md">
        <h2 className="text-headline-sm text-on-surface">تأجيل الموعد</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          اختر موعداً جديداً لـ {postponeTarget?.studentId?.name || 'الطالب'}
        </p>
        <div className="mt-comfortable">
          <Input
            label="الموعد الجديد"
            type="datetime-local"
            value={postponeAt}
            onChange={(e) => setPostponeAt(e.target.value)}
          />
        </div>
        <div className="mt-loose flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPostponeTarget(null)}>
            رجوع
          </Button>
          <Button
            type="button"
            onClick={submitPostpone}
            disabled={postponeMutation.isPending || !postponeAt}
          >
            {postponeMutation.isPending ? 'جاري التأجيل…' : 'تأكيد التأجيل'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
