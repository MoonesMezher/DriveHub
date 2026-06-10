import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader, AsyncContent, StatCard, Card, Button } from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

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
  const upcoming = schedule.filter((l) => l.status === 'scheduled' && new Date(l.scheduledAt) >= new Date())
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
            <StatCard label="مواعيد قادمة" value={upcoming.length} icon="event" />
            <StatCard label="إجمالي الجدول" value={schedule.length} icon="calendar_month" />
          </div>

          <Card title="أقرب المواعيد">
            {upcoming.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">لا توجد مواعيد قادمة</p>
            ) : (
              <div className="space-y-comfortable">
                {upcoming.slice(0, 5).map((lesson) => (
                  <div key={lesson._id} className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="text-body-md font-medium">{formatDateTime(lesson.scheduledAt)}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {lesson.studentId?.name ?? '—'}
                      </p>
                    </div>
                    <span className="text-label-sm text-primary">
                      {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link to={`${ROUTES.COACH}/schedule`} className="mt-4 inline-block text-label-md text-primary hover:underline">
              عرض الجدول الكامل
            </Link>
          </Card>

          <div className="grid gap-comfortable sm:grid-cols-2">
            <Link to={`${ROUTES.COACH}/schedule`}>
              <Card hoverable className="cursor-pointer">
                <h3 className="text-headline-sm text-primary">الجدول</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">مواعيد الدروس العملية</p>
              </Card>
            </Link>
            <Link to={`${ROUTES.COACH}/students`}>
              <Card hoverable className="cursor-pointer">
                <h3 className="text-headline-sm text-primary">الطلاب</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">قائمة طلابك</p>
              </Card>
            </Link>
          </div>
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
