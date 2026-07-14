import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, SkeletonTable, Alert,
  Select, FormSection, StatusBadge,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate, formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'
import {
  ENROLLMENT_REJECTION_REASONS,
  resolveRejectionMessage,
} from '@/lib/constants/rejectionReasons'
import { useToast } from '@/hooks/useToast'
import { EnrollmentDocumentsPanel } from '../components/EnrollmentDocumentsPanel'

export const ManagerEnrollmentsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [rejectReason, setRejectReason] = useState({})
  const [rejectPreset, setRejectPreset] = useState({})
  const [paymentDays, setPaymentDays] = useState('3')
  const [confirmRefs, setConfirmRefs] = useState({})
  const [docsEnrollmentId, setDocsEnrollmentId] = useState(null)

  const coursesQuery = useQuery({
    queryKey: ['manager', 'courses'],
    queryFn: () => managerService.listCourses().then(unwrap),
  })

  const courses = coursesQuery.data?.courses ?? []

  const courseOptions = courses.map((c) => ({
    value: c._id,
    label: `${c.categoryCode}${c.subTypeCode ? ` (${c.subTypeCode})` : ''} — ${c.paidCount ?? 0}/${c.maxStudents}`,
  }))

  const queueQuery = useQuery({
    queryKey: ['manager', 'enrollmentQueue', courseId],
    queryFn: () => managerService.enrollmentQueue(courseId).then(unwrap),
    enabled: Boolean(courseId),
  })

  const paymentQueueQuery = useQuery({
    queryKey: ['manager', 'awaitingPaymentQueue', courseId],
    queryFn: () => managerService.awaitingPaymentQueue(courseId).then(unwrap),
    enabled: Boolean(courseId),
  })

  const queue = queueQuery.data?.queue ?? []
  const paymentQueue = paymentQueueQuery.data?.queue ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['manager', 'enrollmentQueue', courseId] })
    queryClient.invalidateQueries({ queryKey: ['manager', 'awaitingPaymentQueue', courseId] })
  }

  const acceptMutation = useMutation({
    mutationFn: (id) => managerService.acceptEnrollment(id, Number(paymentDays)).then(unwrap),
    onSuccess: () => {
      toast.success('تم قبول الطلب')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل قبول الطلب'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => managerService.rejectEnrollment(id, reason).then(unwrap),
    onSuccess: () => {
      toast.success('تم رفض الطلب')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل رفض الطلب'),
  })

  const confirmPaymentMutation = useMutation({
    mutationFn: ({ id, amount, gatewayRef }) =>
      managerService.confirmEnrollmentPayment(id, amount, gatewayRef).then(unwrap),
    onSuccess: () => {
      toast.success('تم تأكيد الدفع اليدوي — تم حجز المقعد')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل تأكيد الدفع'),
  })

  const columns = useMemo(() => [
    {
      key: 'student',
      label: 'الطالب',
      render: (item) => item.userId?.name || item.userId?.email || '—',
    },
    { key: 'categoryCode', label: 'الفئة' },
    {
      key: 'status',
      label: 'الحالة',
      render: (item) => <StatusBadge status={item.status} labels={ENROLLMENT_STATUS_LABELS} />,
    },
    {
      key: 'createdAt',
      label: 'تاريخ التقديم',
      render: (item) => formatDate(item.createdAt),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (item) => (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDocsEnrollmentId(docsEnrollmentId === item._id ? null : item._id)}
          >
            مستندات
          </Button>
          <Button
            size="sm"
            onClick={() => acceptMutation.mutate(item._id)}
            disabled={acceptMutation.isPending}
          >
            قبول
          </Button>
          <Select
            value={rejectPreset[item._id] || ''}
            onChange={(e) =>
              setRejectPreset((r) => ({ ...r, [item._id]: e.target.value }))
            }
            options={[
              { value: '', label: '— سبب الرفض —' },
              ...ENROLLMENT_REJECTION_REASONS.map((r) => ({ value: r.value, label: r.label })),
              { value: 'custom', label: 'سبب آخر (نص حر)' },
            ]}
            wrapperClassName="min-w-[200px]"
          />
          {rejectPreset[item._id] === 'custom' && (
            <Input
              placeholder="اكتب سبب الرفض"
              value={rejectReason[item._id] || ''}
              onChange={(e) =>
                setRejectReason((r) => ({ ...r, [item._id]: e.target.value }))
              }
              wrapperClassName="min-w-[160px]"
            />
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              const preset = rejectPreset[item._id]
              const reason = resolveRejectionMessage(
                preset === 'custom' ? null : preset,
                rejectReason[item._id],
              )
              rejectMutation.mutate({ id: item._id, reason })
            }}
            disabled={rejectMutation.isPending || !rejectPreset[item._id]}
          >
            رفض
          </Button>
        </div>
      ),
    },
  ], [acceptMutation.isPending, rejectMutation.isPending, rejectReason, rejectPreset, docsEnrollmentId])

  const paymentColumns = useMemo(() => [
    {
      key: 'student',
      label: 'الطالب',
      render: (item) => item.userId?.name || item.userId?.email || '—',
    },
    {
      key: 'amount',
      label: 'المبلغ',
      render: (item) => (item.pendingPayment?.amount ? `${item.pendingPayment.amount} د.أ` : '—'),
    },
    {
      key: 'claimed',
      label: 'إعلام الطالب',
      render: (item) => (
        item.pendingPayment?.studentClaimedAt
          ? formatDateTime(item.pendingPayment.studentClaimedAt)
          : 'لم يُعلِن بعد'
      ),
    },
    {
      key: 'reference',
      label: 'مرجع الطالب',
      render: (item) => item.pendingPayment?.studentReference || '—',
    },
    {
      key: 'deadline',
      label: 'مهلة الدفع',
      render: (item) => (item.paymentDeadline ? formatDateTime(item.paymentDeadline) : '—'),
    },
    {
      key: 'actions',
      label: 'تأكيد الدفع اليدوي',
      render: (item) => {
        const amount = item.pendingPayment?.amount
        if (!amount) {
          return <span className="text-label-sm text-on-surface-variant">بانتظار عرض الطالب للتعليمات</span>
        }
        return (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="مرجع داخلي (اختياري)"
              value={confirmRefs[item._id] || ''}
              onChange={(e) =>
                setConfirmRefs((r) => ({ ...r, [item._id]: e.target.value }))
              }
              wrapperClassName="min-w-[140px]"
            />
            <Button
              size="sm"
              onClick={() =>
                confirmPaymentMutation.mutate({
                  id: item._id,
                  amount,
                  gatewayRef: confirmRefs[item._id]?.trim() || undefined,
                })
              }
              disabled={confirmPaymentMutation.isPending}
            >
              تأكيد استلام الدفع
            </Button>
          </div>
        )
      },
    },
  ], [confirmPaymentMutation.isPending, confirmRefs])

  return (
    <div>
      <PageHeader
        variant="compact"
        title="طلبات الالتحاق"
        description="قبول الطلبات الجديدة وتأكيد الدفع اليدوي خارج المنصة"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <div className="space-y-loose">
          <Card title="قائمة الانتظار للمراجعة" padding="none">
            {!courseId ? (
              <div className="p-comfortable text-body-md text-on-surface-variant">
                اختر دورة من القائمة لعرض طلبات الالتحاق
              </div>
            ) : queueQuery.isLoading ? (
              <div className="p-comfortable"><SkeletonTable rows={4} cols={5} /></div>
            ) : queueQuery.error ? (
              <div className="p-comfortable">
                <Alert variant="error" title="حدث خطأ">{getErrorMessage(queueQuery.error)}</Alert>
              </div>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  rows={queue}
                  emptyLabel="لا توجد طلبات بانتظار المراجعة (حسب الأماكن المتاحة)"
                />
                {docsEnrollmentId && (
                  <div className="border-t border-outline-variant p-comfortable">
                    <EnrollmentDocumentsPanel
                      enrollmentId={docsEnrollmentId}
                      onClose={() => setDocsEnrollmentId(null)}
                    />
                  </div>
                )}
              </>
            )}
          </Card>

          <Card title="بانتظار تأكيد الدفع اليدوي" padding="none">
            {!courseId ? (
              <div className="p-comfortable text-body-md text-on-surface-variant">
                اختر دورة لعرض الطلاب الذين يحتاجون تأكيد استلام الدفع
              </div>
            ) : paymentQueueQuery.isLoading ? (
              <div className="p-comfortable"><SkeletonTable rows={3} cols={6} /></div>
            ) : paymentQueueQuery.error ? (
              <div className="p-comfortable">
                <Alert variant="error" title="حدث خطأ">{getErrorMessage(paymentQueueQuery.error)}</Alert>
              </div>
            ) : (
              <DataTable
                columns={paymentColumns}
                rows={paymentQueue}
                emptyLabel="لا توجد طلبات بانتظار تأكيد الدفع"
              />
            )}
          </Card>
        </div>

        <Card title="اختيار الدورة" className="xl:sticky xl:top-24 xl:self-start">
          <FormSection description="حدّد الدورة ومهلة الدفع عند القبول — الدفع يتم خارج المنصة">
            <Select
              label="الدورة"
              placeholder="— اختر دورة —"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              options={courseOptions}
            />
            <Input
              label="مهلة الدفع عند القبول (أيام)"
              type="number"
              min={1}
              max={14}
              value={paymentDays}
              onChange={(e) => setPaymentDays(e.target.value)}
            />
          </FormSection>
        </Card>
      </div>
    </div>
  )
}
