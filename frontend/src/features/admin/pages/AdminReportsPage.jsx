import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  PageHeader, Card, StatCard, DataTable, SkeletonTable, Alert, Button, Badge, Input,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/helpers/format'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { rosterVerifyUrl, rosterQrImageUrl } from '@/lib/helpers/roster'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'

export const AdminReportsPage = () => {
  const [verifyToken, setVerifyToken] = useState('')
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyError, setVerifyError] = useState(null)

  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', 'full'],
    queryFn: () => adminService.reports().then(unwrap),
  })

  const verifyMutation = useMutation({
    mutationFn: (token) => adminService.verifyRoster(token).then(unwrap),
    onSuccess: (data) => {
      setVerifyResult(data?.verification ?? data)
      setVerifyError(null)
    },
    onError: (err) => {
      setVerifyResult(null)
      setVerifyError(getErrorMessage(err))
    },
  })

  const reports = reportsQuery.data?.reports ?? reportsQuery.data ?? {}
  const enrollmentsByStatus = reports.enrollments?.byStatus ?? {}

  const handleVerify = (e) => {
    e.preventDefault()
    const token = verifyToken.trim()
    if (!token) return
    verifyMutation.mutate(token)
  }

  const enrollmentColumns = [
    {
      key: 'status',
      label: 'الحالة',
      render: (row) => ENROLLMENT_STATUS_LABELS[row.status] || row.status,
    },
    {
      key: 'count',
      label: 'العدد',
      render: (row) => <span className="font-medium">{formatNumber(row.count)}</span>,
    },
  ]

  const enrollmentRows = Object.entries(enrollmentsByStatus).map(([status, count]) => ({
    id: status,
    status,
    count,
  }))

  return (
    <div>
      <PageHeader
        variant="compact"
        title="التقارير"
        description="تقرير شامل عن أداء المنصة"
      />

      {reportsQuery.isLoading ? (
        <div className="space-y-loose">
          <SkeletonTable rows={3} cols={2} />
          <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><div className="h-20 animate-pulse rounded-lg bg-surface-container" /></Card>
            ))}
          </div>
        </div>
      ) : reportsQuery.error ? (
        <Alert variant="error" title="حدث خطأ">{getErrorMessage(reportsQuery.error)}</Alert>
      ) : (
        <div className="space-y-loose">
          <Card title="التحقق من QR — قائمة طلاب">
            <p className="mb-4 text-body-md text-on-surface-variant">
              أدخل رمز التحقق للتأكد من صحة قائمة الطلاب المرسلة (يُسجّل في سجل التدقيق).
            </p>
            <form onSubmit={handleVerify} className="flex flex-wrap gap-3">
              <Input
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="رمز التحقق"
                wrapperClassName="min-w-[16rem] flex-1"
              />
              <Button type="submit" disabled={verifyMutation.isPending || !verifyToken.trim()}>
                {verifyMutation.isPending ? 'جاري التحقق…' : 'تحقق'}
              </Button>
            </form>

            {verifyError && (
              <Alert variant="error" title="فشل التحقق" className="mt-4">{verifyError}</Alert>
            )}

            {verifyResult?.valid && (
              <div className="mt-comfortable space-y-3 rounded-lg bg-surface-container p-comfortable text-body-md">
                {verifyToken && (
                  <img
                    src={rosterQrImageUrl(verifyToken.trim(), 120)}
                    alt="QR scanned"
                    className="rounded border border-outline-variant/50 bg-white p-2"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">قائمة صالحة</Badge>
                  <Badge variant="default">{verifyResult.status}</Badge>
                </div>
                <p>المدرسة: {verifyResult.school?.name ?? verifyResult.qrPayload?.schoolName ?? '—'}</p>
                <p>
                  الفئة: {verifyResult.course?.categoryCode ?? verifyResult.qrPayload?.categoryCode ?? '—'}
                  {verifyResult.course?.subTypeCode ? ` (${verifyResult.course.subTypeCode})` : ''}
                </p>
                <p>عدد الطلاب: {verifyResult.studentCount ?? verifyResult.qrPayload?.studentCount ?? '—'}</p>
                <p>تاريخ الإرسال: {formatDateTime(verifyResult.submittedAt)}</p>
                {verifyResult.trafficBatchId && (
                  <p>دفعة المرور: {verifyResult.trafficBatchId}</p>
                )}
              </div>
            )}
          </Card>

          <StatCard
            label="إجمالي الرصيد المشحون"
            value={formatCurrency(reports.wallet?.totalCredited ?? 0)}
            icon="account_balance_wallet"
            trendLabel={
              reports.wallet?.creditCount != null
                ? `${formatNumber(reports.wallet.creditCount)} عملية شحن`
                : undefined
            }
            trend="up"
            className="border border-primary/20 bg-primary/5"
          />

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
                  <dt className="text-on-surface-variant">إجمالي الرصيد المشحون</dt>
                  <dd className="font-medium">{formatCurrency(reports.wallet?.totalCredited ?? 0)}</dd>
                </div>
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
                  <dd>{formatNumber(reports.payments?.count ?? 0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">نسبة العمولة الحالية</dt>
                  <dd>{formatPercent(reports.commissionRate ?? 0, { digits: 2 })}</dd>
                </div>
              </dl>
            </Card>

            <Card title="الاشتراكات" padding="none">
              <dl className="space-y-3 p-comfortable text-body-md">
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">فترة التقرير</dt>
                  <dd>{reports.period || '30d'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant">اشتراكات آخر 30 يوم</dt>
                  <dd>{formatNumber(reports.enrollments?.last30Days ?? 0)}</dd>
                </div>
              </dl>

              {enrollmentRows.length > 0 ? (
                <DataTable columns={enrollmentColumns} rows={enrollmentRows} />
              ) : (
                <p className="p-comfortable text-body-md text-on-surface-variant">لا توجد بيانات اشتراكات</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
