import { useQuery } from '@tanstack/react-query'
import { PageHeader, StatCard, Card, AsyncContent } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatCurrency } from '@/lib/helpers/format'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

export const AdminHomePage = () => {
  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminService.reports().then(unwrap),
  })

  const reports = reportsQuery.data?.reports ?? reportsQuery.data ?? {}
  const enrollmentsByStatus = reports.enrollments?.byStatus ?? {}

  return (
    <div>
      <PageHeader
        title="لوحة الإدارة"
        description="ملخص التقارير والإحصائيات"
        actions={
          <Link
            to={`${ROUTES.ADMIN}/reports`}
            className="inline-flex h-11 items-center rounded-lg border border-primary px-5 text-label-md text-primary transition-all hover:bg-surface-container-low"
          >
            التقارير الكاملة
          </Link>
        }
      />

      <AsyncContent
        isLoading={reportsQuery.isLoading}
        error={reportsQuery.error}
        isEmpty={false}
      >
        {() => (
          <div className="space-y-loose">
            <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="المدارس النشطة"
                value={`${reports.schools?.active ?? 0} / ${reports.schools?.total ?? 0}`}
                icon="domain"
              />
              <StatCard label="المستخدمون النشطون" value={reports.users?.active ?? 0} icon="group" />
              <StatCard
                label="اشتراكات آخر 30 يوم"
                value={reports.enrollments?.last30Days ?? 0}
                icon="person_add"
              />
              <StatCard
                label="إجمالي المدفوعات"
                value={formatCurrency(reports.payments?.totalAmount)}
                icon="payments"
              />
            </div>

            <div className="grid gap-loose lg:grid-cols-2">
              <Card title="المدفوعات">
                <dl className="space-y-3 text-body-md">
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">عدد العمليات</dt>
                    <dd>{reports.payments?.count ?? 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">حصة المنصة</dt>
                    <dd>{formatCurrency(reports.payments?.platformShare)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">حصة المدارس</dt>
                    <dd>{formatCurrency(reports.payments?.schoolShare)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">نسبة العمولة</dt>
                    <dd>{((reports.commissionRate ?? 0) * 100).toFixed(1)}%</dd>
                  </div>
                </dl>
              </Card>

              <Card title="الاشتراكات حسب الحالة">
                {Object.keys(enrollmentsByStatus).length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">لا توجد بيانات</p>
                ) : (
                  <ul className="space-y-2">
                    {Object.entries(enrollmentsByStatus).map(([status, count]) => (
                      <li key={status} className="flex justify-between text-body-md">
                        <span>{ENROLLMENT_STATUS_LABELS[status] || status}</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
