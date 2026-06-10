import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent, StatusBadge } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { useToast } from '@/hooks/useToast'

const reviewStatusLabels = {
  pending: 'قيد المراجعة',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
}

const reviewStatusVariants = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

export const AdminCompliancePage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [rejectReasons, setRejectReasons] = useState({})

  const reviewsQuery = useQuery({
    queryKey: ['admin', 'reviewsPending'],
    queryFn: () => adminService.pendingReviews().then(unwrap),
  })

  const applicationsQuery = useQuery({
    queryKey: ['admin', 'applications'],
    queryFn: () => adminService.listApplications().then(unwrap),
  })

  const reviews = reviewsQuery.data?.reviews ?? []
  const applications = applicationsQuery.data?.applications ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reviewsPending'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] })
  }

  const moderateMutation = useMutation({
    mutationFn: ({ id, adminStatus }) => adminService.moderateReview(id, adminStatus).then(unwrap),
    onSuccess: () => {
      toast.success('تمت مراجعة التقييم')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل مراجعة التقييم'),
  })

  const reviewAppMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }) =>
      adminService.reviewApplication(id, { status, rejectionReason }).then(unwrap),
    onSuccess: () => {
      toast.success('تمت مراجعة الطلب')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل مراجعة الطلب'),
  })

  return (
    <div>
      <PageHeader
        title="التحقق والامتثال"
        description="مراجعة التقييمات المعلّقة وطلبات انضمام المدارس"
      />

      <div className="space-y-loose">
        <Card title="تقييمات بانتظار الموافقة">
          <AsyncContent
            isLoading={reviewsQuery.isLoading}
            error={reviewsQuery.error}
            isEmpty={reviews.length === 0}
            emptyTitle="لا توجد تقييمات معلّقة"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">المدرسة</th>
                    <th className="py-3 pe-4 text-start">المقيّم</th>
                    <th className="py-3 pe-4 text-start">التقييم</th>
                    <th className="py-3 pe-4 text-start">التعليق</th>
                    <th className="py-3 pe-4 text-start">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4">{review.schoolId?.name || '—'}</td>
                      <td className="py-3 pe-4">{review.reviewerId?.name || '—'}</td>
                      <td className="py-3 pe-4">{review.rating}/5</td>
                      <td className="py-3 pe-4 max-w-xs truncate">{review.comment || '—'}</td>
                      <td className="py-3 pe-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              moderateMutation.mutate({ id: review._id, adminStatus: 'approved' })
                            }
                            disabled={moderateMutation.isPending}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              moderateMutation.mutate({ id: review._id, adminStatus: 'rejected' })
                            }
                            disabled={moderateMutation.isPending}
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

        <Card title="طلبات انضمام المدارس">
          <AsyncContent
            isLoading={applicationsQuery.isLoading}
            error={applicationsQuery.error}
            isEmpty={applications.length === 0}
            emptyTitle="لا توجد طلبات معلّقة"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">اسم المدرسة</th>
                    <th className="py-3 pe-4 text-start">مقدّم الطلب</th>
                    <th className="py-3 pe-4 text-start">المحافظة</th>
                    <th className="py-3 pe-4 text-start">الحالة</th>
                    <th className="py-3 pe-4 text-start">التاريخ</th>
                    <th className="py-3 pe-4 text-start">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4">{app.schoolName}</td>
                      <td className="py-3 pe-4">{app.applicantUserId?.name || '—'}</td>
                      <td className="py-3 pe-4">{app.governorate || '—'}</td>
                      <td className="py-3 pe-4">
                        <StatusBadge
                          status={app.status}
                          labels={reviewStatusLabels}
                          variants={reviewStatusVariants}
                        />
                      </td>
                      <td className="py-3 pe-4">{formatDate(app.createdAt)}</td>
                      <td className="py-3 pe-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Button
                            size="sm"
                            onClick={() =>
                              reviewAppMutation.mutate({ id: app._id, status: 'approved' })
                            }
                            disabled={reviewAppMutation.isPending}
                          >
                            قبول
                          </Button>
                          <Input
                            placeholder="سبب الرفض"
                            value={rejectReasons[app._id] || ''}
                            onChange={(e) =>
                              setRejectReasons((r) => ({ ...r, [app._id]: e.target.value }))
                            }
                            wrapperClassName="min-w-[140px]"
                          />
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              reviewAppMutation.mutate({
                                id: app._id,
                                status: 'rejected',
                                rejectionReason: rejectReasons[app._id] || 'مرفوض',
                              })
                            }
                            disabled={reviewAppMutation.isPending}
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
      </div>
    </div>
  )
}
