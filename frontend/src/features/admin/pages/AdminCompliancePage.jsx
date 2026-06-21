import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, SkeletonTable, Alert, Tabs, StatusBadge,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
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

const TABS = [
  { id: 'reviews', label: 'تقييمات معلّقة' },
  { id: 'applications', label: 'طلبات المدارس' },
]

export const AdminCompliancePage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('reviews')
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

  const reviewColumns = [
    {
      key: 'school',
      label: 'المدرسة',
      render: (review) => review.schoolId?.name || '—',
    },
    {
      key: 'reviewer',
      label: 'المقيّم',
      render: (review) => review.reviewerId?.name || '—',
    },
    { key: 'rating', label: 'التقييم', render: (review) => `${review.rating}/5` },
    {
      key: 'comment',
      label: 'التعليق',
      render: (review) => <span className="max-w-xs truncate">{review.comment || '—'}</span>,
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (review) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => moderateMutation.mutate({ id: review._id, adminStatus: 'approved' })}
            disabled={moderateMutation.isPending}
          >
            موافقة
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => moderateMutation.mutate({ id: review._id, adminStatus: 'rejected' })}
            disabled={moderateMutation.isPending}
          >
            رفض
          </Button>
        </div>
      ),
    },
  ]

  const applicationColumns = [
    { key: 'schoolName', label: 'اسم المدرسة' },
    {
      key: 'applicant',
      label: 'مقدّم الطلب',
      render: (app) => app.applicantUserId?.name || '—',
    },
    { key: 'governorate', label: 'المحافظة', render: (app) => app.governorate || '—' },
    {
      key: 'status',
      label: 'الحالة',
      render: (app) => (
        <StatusBadge
          status={app.status}
          labels={reviewStatusLabels}
          variants={reviewStatusVariants}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (app) => formatDate(app.createdAt),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (app) => (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            size="sm"
            onClick={() => reviewAppMutation.mutate({ id: app._id, status: 'approved' })}
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
      ),
    },
  ]

  const isLoading = tab === 'reviews' ? reviewsQuery.isLoading : applicationsQuery.isLoading
  const error = tab === 'reviews' ? reviewsQuery.error : applicationsQuery.error

  return (
    <div>
      <PageHeader
        variant="compact"
        title="التحقق والامتثال"
        description="مراجعة التقييمات المعلّقة وطلبات انضمام المدارس"
      />

      <Card padding="none">
        <Tabs tabs={TABS} activeId={tab} onChange={setTab} className="px-comfortable" />

        <div className="p-comfortable">
          {isLoading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : error ? (
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(error)}</Alert>
          ) : tab === 'reviews' ? (
            <DataTable
              columns={reviewColumns}
              rows={reviews}
              emptyLabel="لا توجد تقييمات معلّقة"
            />
          ) : (
            <DataTable
              columns={applicationColumns}
              rows={applications}
              emptyLabel="لا توجد طلبات معلّقة"
            />
          )}
        </div>
      </Card>
    </div>
  )
}
