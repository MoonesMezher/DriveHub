import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, StatCard, AsyncContent } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatCurrency } from '@/lib/helpers/format'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'

export const AdminReportsPage = () => {
  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', 'full'],
    queryFn: () => adminService.reports().then(unwrap),
  })

  const reports = reportsQuery.data?.reports ?? reportsQuery.data ?? {}
  const enrollmentsByStatus = reports.enrollments?.byStatus ?? {}

  return (
    <div>
      <PageHeader title="التقارير" description="تقرير شامل عن أداء المنصة" />

      <AsyncContent
        isLoading={reportsQuery.isLoading}
        error={reportsQuery.error}
        isEmpty={false}
      >
        {() => (
          <div className="space-y-loose">
            <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="إجمالي المدارس" value={reports.schools?.total ?? 0} icon="domain" />
              <StatCard label="مدارس نشطة" value={reports.schools?.active ?? 0} icon="verified" />
              <StatCard label="مستخدمون نشطون" value={reports.users?.active ?? 0} icon="group" />
              <StatCard
                label="اشتراكات مكتملة"
                value={reports.completedEnrollments ?? 0}
                icon="check_circle"
              />
            </div>

            <div className="grid gap-loose lg:grid-cols-2">
              <Card title="المدفوعات">
                <dl className="space-y-4 text-body-md">
                  <div className="flex justify-between border-b border-outline-variant/50 pb-3">
                    <dt className="text-on-surface-variant">إجمالي المبالغ</dt>
                    <dd className="font-medium">{formatCurrency(reports.payments?.totalAmount)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/50 pb-3">
                    <dt className="text-on-surface-variant">حصة المنصة</dt>
                    <dd>{formatCurrency(reports.payments?.platformShare)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/50 pb-3">
                    <dt className="text-on-surface-variant">حصة المدارس</dt>
                    <dd>{formatCurrency(reports.payments?.schoolShare)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/50 pb-3">
                    <dt className="text-on-surface-variant">عدد العمليات</dt>
                    <dd>{reports.payments?.count ?? 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">نسبة العمولة الحالية</dt>
                    <dd>{((reports.commissionRate ?? 0) * 100).toFixed(2)}%</dd>
                  </div>
                </dl>
              </Card>

              <Card title="الاشتراكات">
                <dl className="mb-comfortable space-y-3 text-body-md">
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">فترة التقرير</dt>
                    <dd>{reports.period || '30d'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant">اشتراكات آخر 30 يوم</dt>
                    <dd>{reports.enrollments?.last30Days ?? 0}</dd>
                  </div>
                </dl>

                {Object.keys(enrollmentsByStatus).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-body-md">
                      <thead>
                        <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                          <th className="py-3 pe-4 text-start">الحالة</th>
                          <th className="py-3 pe-4 text-start">العدد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(enrollmentsByStatus).map(([status, count]) => (
                          <tr key={status} className="border-b border-outline-variant/50 last:border-0">
                            <td className="py-3 pe-4">
                              {ENROLLMENT_STATUS_LABELS[status] || status}
                            </td>
                            <td className="py-3 pe-4 font-medium">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-body-md text-on-surface-variant">لا توجد بيانات اشتراكات</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
