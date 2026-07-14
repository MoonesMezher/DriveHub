import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader, AsyncContent, StatCard, Card, Button, ProgressRing, StatusBadge, Badge, Icon, Alert } from '@/components/ui'
import { AdsBanner } from '@/components/ui/AdsBanner'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime, formatDate } from '@/lib/helpers/date'
import { EXAM_TYPE_LABELS } from '@/lib/constants/statusLabels'
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

          <AdsBanner placement="student" />

          {dashboard?.upcomingExam && (
            <Alert variant="info" title="موعد امتحان المرور">
              <p className="text-headline-sm">
                {EXAM_TYPE_LABELS[dashboard.upcomingExam.examType] ?? dashboard.upcomingExam.examType}
                {' — '}
                {formatDateTime(dashboard.upcomingExam.examDate)}
              </p>
              <p className="mt-1 text-body-md opacity-90">
                {dashboard.upcomingExam.branch}
                {dashboard.upcomingExam.governorate ? ` · ${dashboard.upcomingExam.governorate}` : ''}
              </p>
              <Link to={`${ROUTES.STUDENT}/exam`} className="mt-2 inline-block text-label-md underline">
                تفاصيل الامتحان
              </Link>
            </Alert>
          )}

          {dashboard?.courseLaunch?.launchDate && ['paid', 'active'].includes(dashboard?.enrollment?.status) && (
            <Card variant="tinted" title="انطلاق الدورة">
              <p className="text-body-md">
                {dashboard.enrollment.status === 'paid'
                  ? 'تم تأكيد دفعك — الدورة ستنطلق في:'
                  : 'انطلقت دورتك في:'}
              </p>
              <p className="mt-2 text-headline-sm text-primary">
                {formatDate(dashboard.courseLaunch.launchDate)}
              </p>
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
              <div className="flex flex-col items-center gap-3 text-center sm:items-end sm:text-end">
                <p className="text-label-md text-on-surface-variant">الخطوة التالية</p>
                <p className="max-w-xs text-body-md text-on-surface-variant">{nextAction.description}</p>
                <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                  <Link to={nextAction.to}>
                    <Button>
                      <Icon name={nextAction.icon} size={20} className="me-2" />
                      {nextAction.label}
                    </Button>
                  </Link>
                  <Link to={`${ROUTES.STUDENT}/statistics`}>
                    <Button variant="outline">
                      <Icon name="monitoring" size={20} className="me-2" />
                      إحصائياتي
                    </Button>
                  </Link>
                </div>
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
              label="نسبة الحضور"
              value={`${stats?.attendancePercent ?? 0}%`}
              icon="event_available"
            />
            <Link to={`${ROUTES.STUDENT}/statistics`} className="block">
              <StatCard
                label="عرض الإحصائيات"
                value="التفاصيل"
                icon="monitoring"
                className="cursor-pointer transition-shadow hover:shadow-md"
              />
            </Link>
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
