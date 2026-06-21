import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PageHeader, AsyncContent, Card, Badge, Button, Icon } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const statusVariant = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'error'
  return 'primary'
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

export const CoachSchedulePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach', 'schedule'],
    queryFn: async () => unwrap(await coachService.schedule()),
  })

  const schedule = data?.schedule ?? []
  const weekGroups = useMemo(() => groupByWeek(schedule), [schedule])

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="جدول المواعيد"
        description="دروسك العملية المجدولة"
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
            <Card key={weekStart} title={`أسبوع ${dayjs(weekStart).format('D MMM')} — ${dayjs(weekEnd).format('D MMM YYYY')}`}>
              <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
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
                      <Badge variant={statusVariant(lesson.status)}>
                        {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
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
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
