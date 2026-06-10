import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, StatCard } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import {
  EXAM_SCHEDULE_STATUS_LABELS,
  EXAM_SCHEDULE_STATUS_VARIANT,
} from '@/lib/constants/lessonLabels'
import { EXAM_TYPE_LABELS } from '@/lib/constants/statusLabels'

export const StudentExamPage = () => {
  const examQuery = useQuery({
    queryKey: ['student', 'exam-info'],
    queryFn: async () => unwrap(await studentService.examInfo()),
  })

  const certsQuery = useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: async () => unwrap(await studentService.certificates()),
  })

  const exam = examQuery.data?.exam
  const schedules = exam?.schedules ?? []
  const certificates = certsQuery.data?.certificates ?? []
  const isLoading = examQuery.isLoading || certsQuery.isLoading
  const error = examQuery.error || certsQuery.error

  return (
    <div dir="rtl">
      <PageHeader
        title="امتحان المرور"
        description="مواعيد الامتحان، النتائج، والشهادات"
      />

      <AsyncContent isLoading={isLoading} error={error}>
        {() => (
        <div className="space-y-loose">
          {exam?.enrollment && (
            <Card title="حالة الاشتراك">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">فئة {exam?.enrollment?.categoryCode}</Badge>
                <Badge variant="default">{exam?.enrollment?.status}</Badge>
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

          <Card title="مواعيد الامتحان">
            {schedules.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">لا توجد مواعيد مجدولة</p>
            ) : (
              <div className="space-y-comfortable">
                {schedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 pb-comfortable last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-headline-sm text-on-surface">
                        {EXAM_TYPE_LABELS[schedule.examType] ?? schedule.examType}
                      </p>
                      <p className="mt-1 text-body-md text-on-surface-variant">
                        {formatDateTime(schedule.examDate)} — {schedule.branch}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {schedule.governorate}
                      </p>
                    </div>
                    <Badge variant={EXAM_SCHEDULE_STATUS_VARIANT[schedule.status] ?? 'default'}>
                      {EXAM_SCHEDULE_STATUS_LABELS[schedule.status] ?? schedule.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="الشهادات">
            {certificates.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">لا توجد شهادات بعد</p>
            ) : (
              <div className="space-y-comfortable">
                {certificates.map((cert) => (
                  <div key={cert._id} className="flex flex-wrap items-center justify-between gap-3">
                    <div>
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
