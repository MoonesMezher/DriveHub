import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader, AsyncContent, StatCard, Card, Button, ProgressRing, StatusBadge, Badge } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

export const StudentHomePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const dashboard = data?.dashboard
  const stats = dashboard?.statistics
  const progress = stats?.progressPercent ?? 0

  return (
    <div dir="rtl">
      <PageHeader
        title="لوحة الطالب"
        description="متابعة تقدّمك، المواعيد، والاختبارات"
        actions={
          <Link to={`${ROUTES.STUDENT}/lessons`}>
            <Button variant="outline">حجز موعد</Button>
          </Link>
        }
      />

      <AsyncContent isLoading={isLoading} error={error}>
        {() => (
        <div className="space-y-loose">
          {!dashboard?.enrollment ? (
            <Card variant="tinted" title="لا يوجد اشتراك نشط">
              <p className="text-body-md">اشترك في دورة للوصول إلى المحتوى والمواعيد.</p>
              <Link to="/enroll" className="mt-4 inline-block">
                <Button>طلب اشتراك</Button>
              </Link>
            </Card>
          ) : (
            <Card title="اشتراكك الحالي">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={dashboard?.enrollment?.status} />
                <span className="text-body-md text-on-surface-variant">
                  فئة {dashboard?.enrollment?.categoryCode}
                  {dashboard?.enrollment?.subTypeCode ? ` — ${dashboard.enrollment.subTypeCode}` : ''}
                </span>
              </div>
            </Card>
          )}

          <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="التقدّم"
              value={`${progress}%`}
              icon="trending_up"
            />
            <StatCard
              label="إشعارات غير مقروءة"
              value={dashboard?.unreadNotifications ?? 0}
              icon="notifications"
            />
            <StatCard
              label="دروس مكتملة"
              value={stats?.lessonsCompleted ?? 0}
              icon="check_circle"
            />
            <StatCard
              label="آخر اختبار تجريبي"
              value={
                dashboard?.lastPractice?.score != null
                  ? `${dashboard.lastPractice.score}%`
                  : '—'
              }
              icon="quiz"
            />
          </div>

          <div className="grid gap-comfortable lg:grid-cols-2">
            <Card title="التقدّم العام">
              <ProgressRing
                value={progress}
                label="نسبة الإنجاز"
                sublabel={stats?.lessonsTotal ? `${stats.lessonsCompleted ?? 0} / ${stats.lessonsTotal} درس` : undefined}
              />
            </Card>

            <Card title="الموعد القادم">
              {dashboard?.upcomingLesson ? (
                <div className="space-y-2 text-body-md">
                  <p>{formatDateTime(dashboard.upcomingLesson.scheduledAt)}</p>
                  <p className="text-on-surface-variant">
                    المدرب: {dashboard.upcomingLesson.coachId?.name ?? '—'}
                  </p>
                  <Badge variant="primary">
                    {LESSON_STATUS_LABELS[dashboard.upcomingLesson.status] ?? dashboard.upcomingLesson.status}
                  </Badge>
                </div>
              ) : (
                <p className="text-body-md text-on-surface-variant">لا توجد مواعيد قادمة</p>
              )}
            </Card>
          </div>

          <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
            <Link to={`${ROUTES.STUDENT}/theory`}>
              <Card hoverable className="cursor-pointer">
                <h3 className="text-headline-sm text-primary">التعلم النظري</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">دروس ومحتوى تفاعلي</p>
              </Card>
            </Link>
            <Link to={`${ROUTES.STUDENT}/practice`}>
              <Card hoverable className="cursor-pointer">
                <h3 className="text-headline-sm text-primary">اختبار تجريبي</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">تدرّب قبل الامتحان</p>
              </Card>
            </Link>
            <Link to={`${ROUTES.STUDENT}/exam`}>
              <Card hoverable className="cursor-pointer">
                <h3 className="text-headline-sm text-primary">امتحان المرور</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">المواعيد والشهادات</p>
              </Card>
            </Link>
          </div>
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
