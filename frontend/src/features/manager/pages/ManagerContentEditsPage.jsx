import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, SkeletonTable, Alert,
  Badge, Textarea,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'

export const ManagerContentEditsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [reviewNote, setReviewNote] = useState('')
  const [activeId, setActiveId] = useState(null)

  const editsQuery = useQuery({
    queryKey: ['manager', 'content-edits'],
    queryFn: () => managerService.pendingEdits().then(unwrap),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, editType }) =>
      managerService.reviewEdit(id, { status, reviewNote: reviewNote || undefined, editType }).then(unwrap),
    onSuccess: () => {
      toast.success('تمت مراجعة الطلب')
      setReviewNote('')
      setActiveId(null)
      queryClient.invalidateQueries({ queryKey: ['manager', 'content-edits'] })
    },
    onError: (err) => toast.error(err, 'فشل مراجعة الطلب'),
  })

  const edits = editsQuery.data?.edits ?? {}
  const questionEdits = edits.questionEdits ?? []
  const contentEdits = edits.contentEdits ?? []
  const allEdits = [
    ...questionEdits.map((e) => ({ ...e, editType: 'question' })),
    ...contentEdits.map((e) => ({ ...e, editType: 'content' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const handleReview = (id, status, editType) => {
    reviewMutation.mutate({ id, status, editType })
  }

  const columns = [
    {
      key: 'type',
      label: 'النوع',
      render: (edit) => (
        <div className="flex flex-wrap gap-2">
          <Badge variant={edit.editType === 'question' ? 'primary' : 'secondary'}>
            {edit.editType === 'question' ? 'سؤال' : 'محتوى'}
          </Badge>
          {edit.contentType && <Badge variant="default">{edit.contentType}</Badge>}
        </div>
      ),
    },
    {
      key: 'coach',
      label: 'المدرب',
      render: (edit) => edit.coachId?.name ?? 'مدرب',
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (edit) => formatDateTime(edit.createdAt),
    },
    {
      key: 'changes',
      label: 'التعديلات',
      render: (edit) =>
        edit.proposedChanges ? (
          <pre className="max-h-24 max-w-xs overflow-auto rounded bg-surface-container-low p-2 text-label-sm text-on-surface-variant">
            {JSON.stringify(edit.proposedChanges, null, 2)}
          </pre>
        ) : '—',
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (edit) =>
        activeId === edit._id ? (
          <div className="space-y-2">
            <Textarea
              label="ملاحظة المراجعة (اختياري)"
              rows={2}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleReview(edit._id, 'approved', edit.editType)}
                disabled={reviewMutation.isPending}
              >
                موافقة
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReview(edit._id, 'rejected', edit.editType)}
                disabled={reviewMutation.isPending}
              >
                رفض
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setActiveId(null); setReviewNote('') }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveId(edit._id)}
          >
            مراجعة
          </Button>
        ),
    },
  ]

  const mobileCardRender = (edit) => (
    <Card key={edit._id} padding="md">
      <div className="flex flex-wrap gap-2">
        <Badge variant={edit.editType === 'question' ? 'primary' : 'secondary'}>
          {edit.editType === 'question' ? 'سؤال' : 'محتوى'}
        </Badge>
        {edit.contentType && <Badge variant="default">{edit.contentType}</Badge>}
      </div>
      <p className="mt-2 text-headline-sm text-on-surface">{edit.coachId?.name ?? 'مدرب'}</p>
      <p className="mt-1 text-label-sm text-on-surface-variant">{formatDateTime(edit.createdAt)}</p>
      {edit.proposedChanges && (
        <pre className="mt-3 max-h-32 overflow-auto rounded bg-surface-container-low p-3 text-label-sm text-on-surface-variant">
          {JSON.stringify(edit.proposedChanges, null, 2)}
        </pre>
      )}
      {activeId === edit._id ? (
        <div className="mt-4 space-y-3 border-t border-outline-variant/50 pt-4">
          <Input
            label="ملاحظة المراجعة (اختياري)"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => handleReview(edit._id, 'approved', edit.editType)} disabled={reviewMutation.isPending}>
              موافقة
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleReview(edit._id, 'rejected', edit.editType)} disabled={reviewMutation.isPending}>
              رفض
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setActiveId(null); setReviewNote('') }}>
              إلغاء
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-4" onClick={() => setActiveId(edit._id)}>
          مراجعة
        </Button>
      )}
    </Card>
  )

  return (
    <div>
      <PageHeader
        variant="compact"
        title="طلبات تعديل المحتوى"
        description="مراجعة التعديلات المقترحة من المدربين"
      />

      <Card title="طلبات قيد الانتظار" padding="none">
        {editsQuery.isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={4} cols={5} /></div>
        ) : editsQuery.error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(editsQuery.error)}</Alert>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={allEdits}
            emptyLabel="لا توجد طلبات"
            emptyPreset="no-data"
            mobileCardRender={mobileCardRender}
          />
        )}
      </Card>
    </div>
  )
}
