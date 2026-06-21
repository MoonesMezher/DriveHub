import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, SkeletonTable, Alert,
  Select, FormSection, StatusBadge,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'
import { useToast } from '@/hooks/useToast'

export const ManagerEnrollmentsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [rejectReason, setRejectReason] = useState({})
  const [paymentDays, setPaymentDays] = useState('3')

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

  const queue = queueQuery.data?.queue ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['manager', 'enrollmentQueue', courseId] })

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

  const columns = useMemo(() => [
    {
      key: 'id',
      label: 'المعرّف',
      render: (item) => <span className="font-mono text-label-sm">{item._id.slice(-8)}</span>,
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
            onClick={() => acceptMutation.mutate(item._id)}
            disabled={acceptMutation.isPending}
          >
            قبول
          </Button>
          <Input
            placeholder="سبب الرفض"
            value={rejectReason[item._id] || ''}
            onChange={(e) =>
              setRejectReason((r) => ({ ...r, [item._id]: e.target.value }))
            }
            wrapperClassName="min-w-[160px]"
          />
          <Button
            size="sm"
            variant="danger"
            onClick={() =>
              rejectMutation.mutate({
                id: item._id,
                reason: rejectReason[item._id] || 'مرفوض',
              })
            }
            disabled={rejectMutation.isPending}
          >
            رفض
          </Button>
        </div>
      ),
    },
  ], [acceptMutation.isPending, rejectMutation.isPending, rejectReason])

  return (
    <div>
      <PageHeader
        variant="compact"
        title="طلبات الالتحاق"
        description="اختر دورة لعرض قائمة الانتظار وقبول أو رفض الطلبات"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="قائمة الانتظار" padding="none">
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
            <DataTable
              columns={columns}
              rows={queue}
              emptyLabel="لا توجد طلبات في قائمة الانتظار"
            />
          )}
        </Card>

        <Card title="اختيار الدورة" className="xl:sticky xl:top-24 xl:self-start">
          <FormSection description="حدّد الدورة ومهلة الدفع عند القبول">
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
