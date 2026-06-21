import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Badge, StatCard, Button, Icon, Alert } from '@/components/ui'
import { studentService, enrollmentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatDateTime } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import {
  EXAM_SCHEDULE_STATUS_LABELS,
  EXAM_SCHEDULE_STATUS_VARIANT,
} from '@/lib/constants/lessonLabels'
import {
  EXAM_TYPE_LABELS,
  ENROLLMENT_STATUS_LABELS,
  RETAKE_SCOPE_LABELS,
} from '@/lib/constants/statusLabels'

export const StudentExamPage = () => {
  const queryClient = useQueryClient()

  const examQuery = useQuery({
    queryKey: ['student', 'exam-info'],
    queryFn: async () => unwrap(await studentService.examInfo()),
  })

  const certsQuery = useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: async () => unwrap(await studentService.certificates()),
  })

  const dashboardQuery = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const retakeMutation = useMutation({
    mutationFn: (priorEnrollmentId) =>
      enrollmentService.createRetake({ priorEnrollmentId }),
    onSuccess: () => {
      toast.success('تم إنشاء طلب إعادة الاشتراك — أكمل الدفع من صفحة الاشتراك')
      queryClient.invalidateQueries({ queryKey: ['student', 'exam-info'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const exam = examQuery.data?.exam
  const schedules = exam?.schedules ?? []
  const nextSchedule = schedules.find((s) => s.status === 'scheduled' && new Date(s.examDate) >= new Date())
    ?? schedules.find((s) => s.status === 'scheduled')
  const certificates = certsQuery.data?.certificates ?? []
  const stats = dashboardQuery.data?.dashboard?.statistics
  const lastPractice = dashboardQuery.data?.dashboard?.lastPractice
  const isLoading = examQuery.isLoading || certsQuery.isLoading
  const error = examQuery.error || certsQuery.error

  const readinessChecklist = [
    {
      label: 'اشتراك نشط',
      done: Boolean(exam?.enrollment),
      icon: 'school',
    },
    {
      label: 'إكمال التعلم (80%+)',
      done: (stats?.progressPercent ?? 0) >= 80,
      icon: 'menu_book',
    },
    {
      label: 'نجاح الاختبار التجريبي',
      done: lastPractice?.passed === true,
      icon: 'quiz',
    },
    {
      label: 'إكمال الدروس العملية',
      done: (stats?.lessonsTotal ?? 0) > 0 && (stats?.lessonsCompleted ?? 0) >= stats.lessonsTotal,
      icon: 'directions_car',
    },
    {
      label: 'موعد امتحان مجدول',
      done: Boolean(nextSchedule),
      icon: 'event',
    },
  ]

  const readinessScore = readinessChecklist.filter((item) => item.done).length
  const handleRetake = () => {
    const priorId = exam?.enrollment?.id
    if (!priorId) return
    retakeMutation.mutate(priorId)
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="امتحان المرور"
        description="مواعيد الامتحان، النتائج، والشهادات"
      />

      <AsyncContent isLoading={isLoading} error={error}>
        {() => (
        <div className="space-y-loose">
          {nextSchedule && (
            <Alert variant="info" title="موعد الامتحان القادم">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-headline-sm">
                    {EXAM_TYPE_LABELS[nextSchedule.examType] ?? nextSchedule.examType}
                    {' — '}
                    {formatDateTime(nextSchedule.examDate)}
                  </p>
                  <p className="mt-1 text-body-md opacity-90">
                    {nextSchedule.branch} · {nextSchedule.governorate}
                  </p>
                </div>
                <Badge variant={EXAM_SCHEDULE_STATUS_VARIANT[nextSchedule.status] ?? 'primary'}>
                  {EXAM_SCHEDULE_STATUS_LABELS[nextSchedule.status] ?? nextSchedule.status}
                </Badge>
              </div>
            </Alert>
          )}

          <Card title="قائمة الاستعداد للامتحان">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-body-md text-on-surface-variant">
                {readinessScore} من {readinessChecklist.length} متطلبات مكتملة
              </p>
              <Badge variant={readinessScore === readinessChecklist.length ? 'success' : 'warning'}>
                {readinessScore === readinessChecklist.length ? 'جاهز' : 'قيد الإعداد'}
              </Badge>
            </div>
            <ul className="space-y-3">
              {readinessChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.done ? 'bg-success-container text-on-success-container' : 'bg-surface-container text-on-surface-variant'}`}>
                    <Icon name={item.done ? 'check_circle' : item.icon} size={20} />
                  </div>
                  <span className={`text-body-md ${item.done ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {exam?.retakeEligible && (
            <Card title="إعادة الاشتراك">
              <p className="text-body-md text-on-surface-variant">
                لم تنجح في الامتحان النهائي. يمكنك طلب إعادة اشتراك
                {exam.retakeScope && (
                  <> ({RETAKE_SCOPE_LABELS[exam.retakeScope] ?? exam.retakeScope})</>
                )}
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={handleRetake}
                  disabled={retakeMutation.isPending}
                >
                  <Icon name="replay" size={18} className="me-1" />
                  {retakeMutation.isPending ? 'جاري الإنشاء…' : 'طلب إعادة اشتراك'}
                </Button>
              </div>
            </Card>
          )}

          {exam?.pendingRetakePayment && (
            <Alert variant="warning" title="دفع إعادة الاشتراك">
              لديك طلب إعادة اشتراك بانتظار الدفع.
              <Link to={ROUTES.ENROLL} className="mt-3 inline-flex">
                <Button type="button" size="sm" className="mt-3">
                  <Icon name="payments" size={18} className="me-1" />
                  إكمال الدفع
                </Button>
              </Link>
            </Alert>
          )}

          {exam?.enrollment && (
            <Card title="حالة الاشتراك">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">فئة {exam?.enrollment?.categoryCode}</Badge>
                <Badge variant="default">
                  {ENROLLMENT_STATUS_LABELS[exam.enrollment.status] ?? exam.enrollment.status}
                </Badge>
                {exam.enrollment.retakeAttempt > 0 && (
                  <Badge variant="warning">محاولة {exam.enrollment.retakeAttempt}</Badge>
                )}
              </div>
            </Card>
          )}

          <div className="grid gap-comfortable sm:grid-cols-3">
            <StatCard
              label="حد النجاح"
              value={`${exam?.passThreshold ?? 70}%`}
              icon="fact_check"
            />
            <StatCard
              label="مواعيد الامتحان"
              value={schedules.length}
              icon="event"
            />
            <StatCard
              label="الشهادات"
              value={certificates.length}
              icon="workspace_premium"
            />
          </div>

          {exam?.finalResult && (
            <Card title="النتيجة النهائية">
              <div className="grid gap-comfortable sm:grid-cols-2">
                {exam.finalResult.theoryScore != null && (
                  <p className="text-body-md">
                    النظري: <strong>{exam.finalResult.theoryScore}%</strong>
                    {exam.finalResult.theoryPassed != null && (
                      <Badge variant={exam.finalResult.theoryPassed ? 'success' : 'error'} className="ms-2">
                        {exam.finalResult.theoryPassed ? 'ناجح' : 'راسب'}
                      </Badge>
                    )}
                  </p>
                )}
                {exam.finalResult.practicalScore != null && (
                  <p className="text-body-md">
                    العملي: <strong>{exam.finalResult.practicalScore}%</strong>
                    {exam.finalResult.practicalPassed != null && (
                      <Badge variant={exam.finalResult.practicalPassed ? 'success' : 'error'} className="ms-2">
                        {exam.finalResult.practicalPassed ? 'ناجح' : 'راسب'}
                      </Badge>
                    )}
                  </p>
                )}
              </div>
            </Card>
          )}

          <div>
            <h2 className="mb-comfortable text-headline-sm text-primary">مواعيد الامتحان</h2>
            {schedules.length === 0 ? (
              <Card>
                <p className="text-body-md text-on-surface-variant">لا توجد مواعيد مجدولة</p>
              </Card>
            ) : (
              <div className="grid gap-comfortable sm:grid-cols-2">
                {schedules.map((schedule) => (
                  <Card key={schedule._id} hoverable>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container">
                          <Icon name="event" size={22} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-headline-sm text-on-surface">
                            {EXAM_TYPE_LABELS[schedule.examType] ?? schedule.examType}
                          </p>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            {formatDateTime(schedule.examDate)}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">
                            {schedule.branch} — {schedule.governorate}
                          </p>
                        </div>
                      </div>
                      <Badge variant={EXAM_SCHEDULE_STATUS_VARIANT[schedule.status] ?? 'default'}>
                        {EXAM_SCHEDULE_STATUS_LABELS[schedule.status] ?? schedule.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card title="الشهادات">
            {certificates.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">لا توجد شهادات بعد</p>
            ) : (
              <div className="grid gap-comfortable sm:grid-cols-2">
                {certificates.map((cert) => (
                  <div key={cert._id} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-comfortable">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-container">
                      <Icon name="workspace_premium" size={26} className="text-on-success-container" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-headline-sm text-on-surface">
                        {cert.licenseNumber ?? cert.certificateNumber ?? 'شهادة'}
                      </p>
                      {cert.issuedAt && (
                        <p className="mt-1 text-body-md text-on-surface-variant">
                          {formatDateTime(cert.issuedAt)}
                        </p>
                      )}
                    </div>
                    {cert.categoryCode && (
                      <Badge variant="success">فئة {cert.categoryCode}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
