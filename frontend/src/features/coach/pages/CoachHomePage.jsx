import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { PageHeader, AsyncContent, StatCard, Card, Button, Badge, Icon } from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const statusVariant = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'error'
  return 'primary'
}

export const CoachHomePage = () => {
  const scheduleQuery = useQuery({
    queryKey: ['coach', 'schedule'],
    queryFn: async () => unwrap(await coachService.schedule()),
  })

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: async () => unwrap(await coachService.students()),
  })

  const schedule = scheduleQuery.data?.schedule ?? []
  const students = studentsQuery.data?.students ?? []
  const now = useMemo(() => dayjs(), [])

  const upcoming = schedule.filter((l) => l.status === 'scheduled' && new Date(l.scheduledAt) >= new Date())
  const todayLessons = useMemo(
    () => upcoming.filter((l) => dayjs(l.scheduledAt).isSame(now, 'day')),
    [upcoming, now],
  )
  const isLoading = scheduleQuery.isLoading || studentsQuery.isLoading
  const error = scheduleQuery.error || studentsQuery.error

  return (
    <div dir="rtl">
      <PageHeader
        title="لوحة المدرب"
        description="جدولك، طلابك، وملاحظاتك"
        actions={
          <Link to={`${ROUTES.COACH}/notes`}>
            <Button variant="outline">إضافة ملاحظة</Button>
          </Link>
        }
      />

      <AsyncContent isLoading={isLoading} error={error}>
        {() => (
        <div className="space-y-loose">
          <div className="grid gap-comfortable sm:grid-cols-3">
            <StatCard label="الطلاب" value={students.length} icon="group" />
            <StatCard label="مواعيد اليوم" value={todayLessons.length} icon="today" />
            <StatCard label="مواعيد قادمة" value={upcoming.length} icon="event" />
          </div>

          <Card title="جدول اليوم">
            {todayLessons.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">لا توجد مواعيد اليوم</p>
            ) : (
              <div className="space-y-comfortable">
                {todayLessons.slice(0, 6).map((lesson) => (
                  <div
                    key={lesson._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-comfortable"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container">
                        <Icon name="schedule" size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-headline-sm text-on-surface">
                          {dayjs(lesson.scheduledAt).format('HH:mm')}
                        </p>
                        <p className="text-body-md text-on-surface-variant">
                          {lesson.studentId?.name ?? '—'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(lesson.status)}>
                      {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Link to={`${ROUTES.COACH}/schedule`} className="mt-4 inline-flex items-center gap-1 text-label-md text-primary hover:underline">
              عرض الجدول الكامل
              <Icon name="arrow_back" size={16} />
            </Link>
          </Card>

          {upcoming.length > todayLessons.length && (
            <Card title="أقرب المواعيد">
              <div className="space-y-comfortable">
                {upcoming.slice(0, 5).map((lesson) => (
                  <div key={lesson._id} className="flex flex-wrap justify-between gap-2 border-b border-outline-variant/40 pb-comfortable last:border-0 last:pb-0">
                    <div>
                      <p className="text-body-md font-medium">{formatDateTime(lesson.scheduledAt)}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {lesson.studentId?.name ?? '—'}
                      </p>
                    </div>
                    <Badge variant={statusVariant(lesson.status)}>
                      {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid gap-comfortable sm:grid-cols-2">
            <Link to={`${ROUTES.COACH}/schedule`}>
              <Card hoverable className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container">
                    <Icon name="calendar_month" size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-primary">الجدول</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">مواعيد الدروس العملية</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to={`${ROUTES.COACH}/students`}>
              <Card hoverable className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container">
                    <Icon name="group" size={22} className="text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-primary">الطلاب</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">قائمة طلابك</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
