import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader, AsyncContent, StatCard, Card, Button, ProgressRing, StatusBadge, Badge, Icon } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const getNextAction = (dashboard, progress) => {
  if (!dashboard?.enrollment) {
    return { label: 'طلب اشتراك', to: '/enroll', icon: 'school', description: 'ابدأ رحلتك بالاشتراك في دورة' }
  }
  if (dashboard?.upcomingLesson) {
    return {
      label: 'عرض الموعد القادم',
      to: `${ROUTES.STUDENT}/lessons`,
      icon: 'event',
      description: formatDateTime(dashboard.upcomingLesson.scheduledAt),
    }
  }
  if (progress < 50) {
    return {
      label: 'متابعة التعلم النظري',
      to: `${ROUTES.STUDENT}/theory`,
      icon: 'menu_book',
      description: 'أكمل دروسك النظرية للمضي قدماً',
    }
  }
  if (dashboard?.lastPractice?.passed !== true) {
    return {
      label: 'اختبار تجريبي',
      to: `${ROUTES.STUDENT}/practice`,
      icon: 'quiz',
      description: 'تدرّب قبل امتحان المرور الرسمي',
    }
  }
  return {
    label: 'معلومات الامتحان',
    to: `${ROUTES.STUDENT}/exam`,
    icon: 'fact_check',
    description: 'تحقق من مواعيدك واستعدادك',
  }
}

export const StudentHomePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const dashboard = data?.dashboard
  const stats = dashboard?.statistics
  const progress = stats?.progressPercent ?? 0
  const nextAction = getNextAction(dashboard, progress)

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

          <Card variant="elevated" padding="lg" className="overflow-hidden">
            <div className="flex flex-col items-center gap-loose sm:flex-row sm:items-center sm:justify-between">
              <ProgressRing
                value={progress}
                size={128}
                strokeWidth={8}
                label="نسبة الإنجاز"
                sublabel={stats?.lessonsTotal ? `${stats.lessonsCompleted ?? 0} / ${stats.lessonsTotal} درس` : `${progress}% مكتمل`}
                className="justify-center sm:justify-start"
              />
              <div className="flex flex-col items-center text-center sm:items-end sm:text-end">
                <p className="text-label-md text-on-surface-variant">الخطوة التالية</p>
                <p className="mt-1 max-w-xs text-body-md text-on-surface-variant">{nextAction.description}</p>
                <Link to={nextAction.to} className="mt-4">
                  <Button>
                    <Icon name={nextAction.icon} size={20} className="me-2" />
                    {nextAction.label}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
            {dashboard?.courseDaysRemaining != null && (
              <StatCard
                label="أيام متبقية في الدورة"
                value={dashboard.courseDaysRemaining}
                icon="calendar_today"
              />
            )}
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

          <Card title="الموعد القادم">
            {dashboard?.upcomingLesson ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 text-body-md">
                  <p className="text-headline-sm text-on-surface">
                    {formatDateTime(dashboard.upcomingLesson.scheduledAt)}
                  </p>
                  <p className="text-on-surface-variant">
                    المدرب: {dashboard.upcomingLesson.coachId?.name ?? '—'}
                  </p>
                </div>
                <Badge variant="primary">
                  {LESSON_STATUS_LABELS[dashboard.upcomingLesson.status] ?? dashboard.upcomingLesson.status}
                </Badge>
              </div>
            ) : (
              <p className="text-body-md text-on-surface-variant">لا توجد مواعيد قادمة</p>
            )}
          </Card>

          <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
            <Link to={`${ROUTES.STUDENT}/theory`}>
              <Card hoverable className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
                    <Icon name="menu_book" size={22} />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-primary">التعلم النظري</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">دروس ومحتوى تفاعلي</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to={`${ROUTES.STUDENT}/practice`}>
              <Card hoverable className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
                    <Icon name="quiz" size={22} />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-primary">اختبار تجريبي</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">تدرّب قبل الامتحان</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to={`${ROUTES.STUDENT}/exam`}>
              <Card hoverable className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary-container text-tertiary">
                    <Icon name="fact_check" size={22} />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-primary">امتحان المرور</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">المواعيد والشهادات</p>
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
