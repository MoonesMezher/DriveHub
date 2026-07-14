import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, DataTable, SkeletonTable, Alert, StatusBadge, Drawer, Textarea,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { usePermissions } from '@/hooks/usePermissions'

const requestStatusLabels = {
  pending: 'قيد المراجعة',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
}

const requestStatusVariants = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const requestTypeLabels = {
  school_onboarding: 'طلب إضافة مدرسة',
}

const maskNationalId = (nationalId) => {
  if (!nationalId) return '—'
  const str = String(nationalId)
  if (str.length <= 4) return str
  return `${'*'.repeat(str.length - 4)}${str.slice(-4)}`
}

export const AdminCompliancePage = () => {
  const toast = useToast()
  const { can } = usePermissions()
  const queryClient = useQueryClient()
  const [includeHistory, setIncludeHistory] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'compliance', includeHistory],
    queryFn: () => adminService.listComplianceRequests({ includeHistory }).then(unwrap),
  })

  const requestDetailsQuery = useQuery({
    queryKey: ['admin', 'compliance', 'details', activeRequestId],
    queryFn: () => adminService.getComplianceRequest(activeRequestId).then(unwrap),
    enabled: Boolean(activeRequestId),
  })

  const requests = listQuery.data?.requests ?? []
  const requestDetails = requestDetailsQuery.data?.request ?? null
  const canManageCompliance = can(PERMISSIONS.MANAGE_COMPLIANCE)
  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'pending').length,
    [requests],
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'compliance'] })
  }

  const approveMutation = useMutation({
    mutationFn: (id) => adminService.approveComplianceRequest(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم قبول الطلب')
      setActiveRequestId(null)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل قبول الطلب'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminService.rejectComplianceRequest(id, reason).then(unwrap),
    onSuccess: () => {
      toast.success('تم رفض الطلب')
      setRejectReason('')
      setActiveRequestId(null)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل رفض الطلب'),
  })

  const columns = [
    { key: 'schoolName', label: 'اسم المدرسة' },
    { key: 'city', label: 'المدينة', render: (row) => row.city || '—' },
    { key: 'ownerName', label: 'المالك', render: (row) => row.ownerName || '—' },
    {
      key: 'type',
      label: 'النوع',
      render: (row) => requestTypeLabels[row.type] || row.type,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (row) => (
        <StatusBadge
          status={row.status}
          labels={requestStatusLabels}
          variants={requestStatusVariants}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setActiveRequestId(row.id)}>
          عرض التفاصيل
        </Button>
      ),
    },
  ]

  const isMutating = approveMutation.isPending || rejectMutation.isPending

  return (
    <div>
      <PageHeader
        variant="compact"
        title="التحقق والامتثال"
        description={`مراجعة طلبات الامتثال عالية الحساسية (طلبات معلّقة: ${pendingCount})`}
      />

      <Card className="mb-comfortable">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-body-md text-on-surface-variant">
            تشمل هذه الصفحة طلبات إضافة المدارس مع بيانات المالك والحساب البنكي والمستندات.
          </p>
          <label className="inline-flex items-center gap-2 text-label-md text-on-surface">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-outline-variant"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
            />
            عرض السجل (الموافق والمرفوض)
          </label>
        </div>
      </Card>

      <Card padding="none">
        <div className="p-comfortable">
          {listQuery.isLoading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : listQuery.error ? (
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(listQuery.error)}</Alert>
          ) : (
            <DataTable
              columns={columns}
              rows={requests}
              emptyLabel={includeHistory ? 'لا توجد طلبات امتثال' : 'لا توجد طلبات معلّقة'}
              onRowClick={(row) => setActiveRequestId(row.id)}
            />
          )}
        </div>
      </Card>

      <Drawer
        open={Boolean(activeRequestId)}
        onClose={() => {
          setActiveRequestId(null)
          setRejectReason('')
        }}
        title="تفاصيل طلب الامتثال"
        className="w-[40rem] max-w-[95vw]"
      >
        <div className="space-y-4 p-comfortable">
          {requestDetailsQuery.isLoading ? (
            <SkeletonTable rows={4} cols={2} />
          ) : requestDetailsQuery.error ? (
            <Alert variant="error" title="فشل تحميل التفاصيل">
              {getErrorMessage(requestDetailsQuery.error)}
            </Alert>
          ) : !requestDetails ? (
            <Alert variant="warning" title="لا توجد بيانات للطلب" />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-label-lg text-on-surface">
                  {requestTypeLabels[requestDetails.type] || requestDetails.type}
                </p>
                <StatusBadge
                  status={requestDetails.status}
                  labels={requestStatusLabels}
                  variants={requestStatusVariants}
                />
              </div>

              <Card>
                <h3 className="mb-3 text-title-sm text-primary">بيانات المدرسة</h3>
                <div className="grid grid-cols-1 gap-2 text-body-md md:grid-cols-2">
                  <p><strong>الاسم:</strong> {requestDetails.school?.name || '—'}</p>
                  <p><strong>الاسم القانوني:</strong> {requestDetails.school?.legalName || '—'}</p>
                  <p><strong>العنوان:</strong> {requestDetails.school?.address || '—'}</p>
                  <p><strong>المدينة:</strong> {requestDetails.school?.city || '—'}</p>
                  <p><strong>رقم الترخيص:</strong> {requestDetails.school?.licenseNumber || '—'}</p>
                  <p><strong>عدد المركبات:</strong> {requestDetails.school?.vehiclesCount ?? '—'}</p>
                  <p className="md:col-span-2">
                    <strong>فئات الرخص:</strong> {(requestDetails.school?.categories || []).join('، ') || '—'}
                  </p>
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-title-sm text-primary">بيانات المالك</h3>
                <div className="grid grid-cols-1 gap-2 text-body-md md:grid-cols-2">
                  <p><strong>الاسم:</strong> {requestDetails.owner?.name || '—'}</p>
                  <p><strong>الرقم الوطني:</strong> {maskNationalId(requestDetails.owner?.nationalId)}</p>
                  <p><strong>الهاتف:</strong> {requestDetails.owner?.phone || '—'}</p>
                  <p><strong>البريد:</strong> {requestDetails.owner?.email || '—'}</p>
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-title-sm text-primary">البيانات البنكية</h3>
                <div className="grid grid-cols-1 gap-2 text-body-md md:grid-cols-2">
                  <p><strong>اسم الحساب:</strong> {requestDetails.bank?.accountName || '—'}</p>
                  <p><strong>اسم البنك:</strong> {requestDetails.bank?.bankName || '—'}</p>
                  <p className="md:col-span-2"><strong>IBAN / رقم الحساب:</strong> {requestDetails.bank?.iban || requestDetails.bank?.accountNumber || '—'}</p>
                </div>
              </Card>

              <Card>
                <h3 className="mb-3 text-title-sm text-primary">المرفقات</h3>
                {requestDetails.documents?.length ? (
                  <div className="space-y-2">
                    {requestDetails.documents.map((doc) => (
                      <div key={doc._id} className="rounded-lg border border-outline-variant p-3 text-body-sm">
                        <p><strong>النوع:</strong> {doc.type}</p>
                        <p><strong>الملف:</strong> {doc.originalName}</p>
                        <p><strong>الحجم:</strong> {doc.size} بايت</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">لا توجد مرفقات مرتبطة بهذا الطلب.</p>
                )}
              </Card>

              {requestDetails.status === 'pending' && canManageCompliance && (
                <Card>
                  <h3 className="mb-3 text-title-sm text-primary">إجراء المراجعة</h3>
                  <Textarea
                    label="سبب الرفض (إجباري عند الرفض)"
                    placeholder="أدخل سبب الرفض إن أردت رفض الطلب"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => approveMutation.mutate(requestDetails.id)}
                      disabled={isMutating}
                    >
                      قبول الطلب
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          toast.error('سبب الرفض مطلوب')
                          return
                        }
                        rejectMutation.mutate({ id: requestDetails.id, reason: rejectReason.trim() })
                      }}
                      disabled={isMutating}
                    >
                      رفض الطلب
                    </Button>
                  </div>
                </Card>
              )}

              {requestDetails.status !== 'pending' && (
                <Alert variant="info" title="تمت معالجة هذا الطلب">
                  {requestDetails.status === 'approved'
                    ? `تمت الموافقة بتاريخ ${formatDate(requestDetails.reviewedAt)}`
                    : `تم الرفض بتاريخ ${formatDate(requestDetails.reviewedAt)} — السبب: ${requestDetails.rejectionReason || 'غير محدد'}`}
                </Alert>
              )}
            </>
          )}
        </div>
      </Drawer>
    </div>
  )
}
