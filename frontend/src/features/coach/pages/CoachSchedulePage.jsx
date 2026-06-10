import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, Button } from '@/components/ui'
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

export const CoachSchedulePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach', 'schedule'],
    queryFn: async () => unwrap(await coachService.schedule()),
  })

  const schedule = data?.schedule ?? []

  return (
    <div dir="rtl">
      <PageHeader
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
<div className="space-y-comfortable">
          {schedule.map((lesson) => (
            <Card key={lesson._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-headline-sm text-on-surface">
                    {formatDateTime(lesson.scheduledAt)}
                  </p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    الطالب: {lesson.studentId?.name ?? '—'}
                    {lesson.studentId?.email ? ` (${lesson.studentId.email})` : ''}
                  </p>
                  {lesson.durationMinutes && (
                    <p className="text-label-sm text-on-surface-variant">
                      المدة: {lesson.durationMinutes} دقيقة
                    </p>
                  )}
                </div>
                <Badge variant={statusVariant(lesson.status)}>
                  {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
