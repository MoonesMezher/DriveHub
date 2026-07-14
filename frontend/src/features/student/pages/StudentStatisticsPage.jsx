import { useQuery } from '@tanstack/react-query'
import {
  PageHeader,
  AsyncContent,
  Card,
  StatCard,
  ProgressRing,
  Badge,
  Icon,
} from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { PRACTICE_PASS_THRESHOLD } from '@/lib/constants/examThresholds'
import { statisticsVerifyUrl, qrImageUrl } from '@/lib/helpers/verification'

export const StudentStatisticsPage = () => {
  const statsQuery = useQuery({
    queryKey: ['student', 'statistics'],
    queryFn: async () => unwrap(await studentService.statistics()),
  })

  const payload = statsQuery.data?.statistics
  const enrollment = payload?.enrollment
  const stats = payload?.statistics
  const verification = payload?.verification
  const practiceScores = stats?.practiceScores ?? []

  return (
    <div dir="rtl">
      <PageHeader
        title="إحصائياتي"
        description="تقدّمك، محاولات الاختبار التجريبي، والحضور"
      />

      <AsyncContent isLoading={statsQuery.isLoading} error={statsQuery.error}>
        {() => (
          <div className="space-y-loose">
            {!enrollment ? (
              <Card title="لا يوجد اشتراك نشط">
                <p className="text-body-md text-on-surface-variant">
                  اشترك في دورة لعرض إحصائياتك التفصيلية.
                </p>
              </Card>
            ) : (
              <>
                <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="التقدم النظري"
                    value={`${stats?.progressPercent ?? 0}%`}
                    icon="menu_book"
                  />
                  <StatCard
                    label="الدروس العملية"
                    value={`${stats?.lessonsCompleted ?? payload?.lessonsCompleted ?? 0} / ${stats?.lessonsTotal ?? '—'}`}
                    icon="directions_car"
                  />
                  <StatCard
                    label="نسبة الحضور"
                    value={`${stats?.attendancePercent ?? 0}%`}
                    icon="event_available"
                  />
                  <StatCard
                    label="محاولات تجريبية"
                    value={payload?.practiceCount ?? practiceScores.length}
                    icon="quiz"
                  />
                </div>

                <Card title="ملخص التقدم">
                  <div className="flex flex-wrap items-center gap-loose">
                    <ProgressRing value={stats?.progressPercent ?? 0} size={96} />
                    <div className="flex-1 space-y-2">
                      <p className="text-body-md text-on-surface-variant">
                        فئة الرخصة: <strong>{enrollment.categoryCode}</strong>
                      </p>
                      {stats?.averageLessonRating != null && (
                        <p className="text-body-md text-on-surface-variant">
                          متوسط تقييم الدروس: <strong>{stats.averageLessonRating}</strong>
                        </p>
                      )}
                      <Badge variant="primary">حد النجاح التجريبي: {PRACTICE_PASS_THRESHOLD}%</Badge>
                    </div>
                  </div>
                </Card>

                {verification?.verificationToken && (
                  <Card title="رمز التحقق من الإحصائيات">
                    <div className="flex flex-wrap items-start gap-loose">
                      <img
                        src={qrImageUrl(statisticsVerifyUrl(verification.verificationToken), 140)}
                        alt="رمز QR للتحقق"
                        className="rounded-xl border border-outline-variant/40"
                        width={140}
                        height={140}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-body-md text-on-surface-variant">
                          يمكن للجهات المختصة مسح الرمز للتحقق من صحة إحصائياتك المسجّلة في المنصة.
                        </p>
                        <p className="mt-2 break-all text-label-sm text-on-surface-variant">
                          {statisticsVerifyUrl(verification.verificationToken)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <div>
                  <h2 className="mb-comfortable text-headline-sm text-primary">سجل الاختبارات التجريبية</h2>
                  {practiceScores.length === 0 ? (
                    <Card>
                      <p className="text-body-md text-on-surface-variant">لا توجد محاولات مسجّلة بعد</p>
                    </Card>
                  ) : (
                    <div className="space-y-comfortable">
                      {practiceScores.map((attempt, index) => (
                        <Card key={attempt.examId || index}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <ProgressRing value={attempt.score ?? 0} size={48} strokeWidth={4} />
                              <div>
                                <p className="text-headline-sm">{attempt.score ?? '—'}%</p>
                                <p className="text-body-md text-on-surface-variant">
                                  {formatDateTime(attempt.takenAt)}
                                </p>
                              </div>
                            </div>
                            <Badge variant={attempt.passed ? 'success' : 'error'}>
                              {attempt.passed ? 'ناجح' : 'راسب'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
