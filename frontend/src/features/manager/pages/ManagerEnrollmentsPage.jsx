import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent, StatusBadge } from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
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

  return (
    <div>
      <PageHeader
        title="طلبات الالتحاق"
        description="اختر دورة لعرض قائمة الانتظار وقبول أو رفض الطلبات"
      />

      <Card title="اختيار الدورة" className="mb-loose">
        <div className="grid gap-comfortable md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="courseSelect" className="block text-label-md text-on-surface">
              الدورة
            </label>
            <select
              id="courseSelect"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">— اختر دورة —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryCode}
                  {c.subTypeCode ? ` (${c.subTypeCode})` : ''} — {c.paidCount ?? 0}/{c.maxStudents}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="مهلة الدفع عند القبول (أيام)"
            type="number"
            min={1}
            max={14}
            value={paymentDays}
            onChange={(e) => setPaymentDays(e.target.value)}
          />
        </div>
      </Card>

      {courseId && (
        <Card title="قائمة الانتظار">
          <AsyncContent
            isLoading={queueQuery.isLoading}
            error={queueQuery.error}
            isEmpty={queue.length === 0}
            emptyTitle="لا توجد طلبات في قائمة الانتظار"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">المعرّف</th>
                    <th className="py-3 pe-4 text-start">الفئة</th>
                    <th className="py-3 pe-4 text-start">الحالة</th>
                    <th className="py-3 pe-4 text-start">تاريخ التقديم</th>
                    <th className="py-3 pe-4 text-start">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4 font-mono text-label-sm">{item._id.slice(-8)}</td>
                      <td className="py-3 pe-4">{item.categoryCode}</td>
                      <td className="py-3 pe-4">
                        <StatusBadge status={item.status} labels={ENROLLMENT_STATUS_LABELS} />
                      </td>
                      <td className="py-3 pe-4">{formatDate(item.createdAt)}</td>
                      <td className="py-3 pe-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            )}
          </AsyncContent>
        </Card>
      )}
    </div>
  )
}
