import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, StatCard, Card, AsyncContent, Button, Icon } from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/helpers/format'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'
import { ROUTES } from '@/lib/constants/routes'

export const TrafficHomePage = () => {
  const dashboardQuery = useQuery({
    queryKey: ['traffic', 'dashboard'],
    queryFn: () => trafficService.dashboard().then(unwrap),
  })

  const data = dashboardQuery.data?.dashboard ?? {}
  const platform = data.platform ?? {}
  const ops = data.operations ?? {}
  const enrollmentsByStatus = platform.enrollments?.byStatus ?? {}
  const schoolsByGov = data.schoolsByGovernorate ?? []

  const quickLinks = [
    { to: `${ROUTES.TRAFFIC}/rosters`, label: 'القوائم', icon: 'list_alt' },
    { to: `${ROUTES.TRAFFIC}/schedules`, label: 'مواعيد الامتحان', icon: 'event' },
    { to: `${ROUTES.TRAFFIC}/results`, label: 'إدخال النتائج', icon: 'assignment_turned_in' },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="لوحة وزارة النقل"
        description="إحصائيات مالية وتشغيلية شاملة عن منصة DriveHub"
        actions={
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button variant="outline" size="sm">
                  <Icon name={link.icon} size={18} />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        }
      />

      <AsyncContent isLoading={dashboardQuery.isLoading} error={dashboardQuery.error} isEmpty={false}>
        {() => (
          <div className="space-y-loose">
            <section>
              <h2 className="mb-comfortable text-headline-sm text-on-surface">ملخص المنصة</h2>
              <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="المدارس النشطة"
                  value={`${formatNumber(platform.schools?.active ?? 0)} / ${formatNumber(platform.schools?.total ?? 0)}`}
                  icon="domain"
                />
                <StatCard
                  label="المستخدمون النشطون"
                  value={formatNumber(platform.users?.active ?? 0)}
                  icon="group"
                />
                <StatCard
                  label="اشتراكات آخر 30 يوم"
                  value={formatNumber(platform.enrollments?.last30Days ?? 0)}
                  icon="person_add"
                />
                <StatCard
                  label="إجمالي المدفوعات"
                  value={formatCurrency(platform.payments?.totalAmount)}
                  icon="payments"
                />
              </div>
            </section>

            <section>
              <h2 className="mb-comfortable text-headline-sm text-on-surface">الإحصائيات المالية</h2>
              <div className="grid gap-loose lg:grid-cols-2">
                <Card title="المدفوعات والعمولات">
                  <dl className="space-y-3 text-body-md">
                    <div className="flex justify-between gap-4">
                      <dt className="text-on-surface-variant">عدد عمليات الدفع</dt>
                      <dd className="font-medium">{formatNumber(platform.payments?.count ?? 0)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-on-surface-variant">إجمالي المبالغ المحصّلة</dt>
                      <dd className="font-medium">{formatCurrency(platform.payments?.totalAmount)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-on-surface-variant">حصة المنصة</dt>
                      <dd className="font-medium text-primary">{formatCurrency(platform.payments?.platformShare)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-on-surface-variant">حصة المدارس</dt>
                      <dd className="font-medium">{formatCurrency(platform.payments?.schoolShare)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-on-surface-variant">نسبة عمولة المنصة</dt>
                      <dd className="font-medium">{formatPercent(platform.commissionRate ?? 0)}</dd>
                    </div>
                  </dl>
                </Card>

                <Card title="الاشتراكات حسب الحالة">
                  {Object.keys(enrollmentsByStatus).length === 0 ? (
                    <p className="text-body-md text-on-surface-variant">لا توجد بيانات</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto custom-scrollbar">
                      {Object.entries(enrollmentsByStatus).map(([status, count]) => (
                        <li key={status} className="flex justify-between text-body-md">
                          <span>{ENROLLMENT_STATUS_LABELS[status] || status}</span>
                          <span className="font-medium">{formatNumber(count)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </section>

            <section>
              <h2 className="mb-comfortable text-headline-sm text-on-surface">عمليات المرور</h2>
              <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="قوائم موزّعة" value={formatNumber(ops.rostersDistributed ?? 0)} icon="list_alt" />
                <StatCard label="قوائم بانتظار التوزيع" value={formatNumber(ops.rostersPending ?? 0)} icon="pending_actions" />
                <StatCard label="مواعيد امتحان قادمة" value={formatNumber(ops.schedulesUpcoming ?? 0)} icon="event" />
                <StatCard label="طلاب جاهزون للامتحان" value={formatNumber(ops.examReadyEnrollments ?? 0)} icon="school" />
                <StatCard label="نتائج مسجّلة" value={formatNumber(ops.resultsTotal ?? 0)} icon="assignment_turned_in" />
                <StatCard label="ناجحون" value={formatNumber(ops.resultsPassed ?? 0)} icon="check_circle" />
                <StatCard label="راسبون" value={formatNumber(ops.resultsFailed ?? 0)} icon="cancel" />
                <StatCard label="رخص صادرة" value={formatNumber(ops.licensesIssued ?? 0)} icon="badge" />
              </div>
            </section>

            {schoolsByGov.length > 0 && (
              <Card title="توزيع المدارس حسب المحافظة">
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {schoolsByGov.map((row) => (
                    <li
                      key={row.governorate}
                      className="flex items-center justify-between rounded-lg bg-surface-container px-4 py-2.5 text-body-md"
                    >
                      <span>{row.governorate}</span>
                      <span className="font-medium text-primary">{formatNumber(row.count)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
