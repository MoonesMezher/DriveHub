import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Badge, StatusBadge, Button, Icon } from '@/components/ui'
import { studentService, enrollmentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatDate } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { RETAKE_SCOPE_LABELS } from '@/lib/constants/statusLabels'

const getFinalOutcome = (finalResult) => {
  if (!finalResult) return null
  if (finalResult.finalStatus === 'final_passed') return 'passed'
  if (finalResult.theoryPassed === false || finalResult.practicalPassed === false) return 'failed'
  if (finalResult.theoryPassed && finalResult.practicalPassed) return 'passed'
  return null
}

const getArchiveDocMeta = (item, outcome) => {
  if (outcome === 'passed') {
    return { icon: 'workspace_premium', label: 'شهادة', color: 'bg-success-container text-on-success-container' }
  }
  if (item.reason === 'retake') {
    return { icon: 'replay', label: 'إعادة', color: 'bg-warning-container text-on-warning-container' }
  }
  if (outcome === 'failed') {
    return { icon: 'description', label: 'سجل', color: 'bg-error-container text-on-error-container' }
  }
  return { icon: 'folder', label: 'أرشيف', color: 'bg-surface-container text-on-surface-variant' }
}

export const StudentArchivePage = () => {
  const queryClient = useQueryClient()

  const archiveQuery = useQuery({
    queryKey: ['student', 'archive'],
    queryFn: async () => unwrap(await studentService.archive()),
  })

  const retakeMutation = useMutation({
    mutationFn: (priorEnrollmentId) =>
      enrollmentService.createRetake({ priorEnrollmentId }),
    onSuccess: () => {
      toast.success('تم إنشاء طلب إعادة الاشتراك')
      queryClient.invalidateQueries({ queryKey: ['student', 'archive'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const items = archiveQuery.data?.archive ?? []

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="أرشيف الاشتراكات"
        description="سجل اشتراكاتك السابقة عند إعادة التسجيل أو الإعادة"
      />

      <AsyncContent
        isLoading={archiveQuery.isLoading}
        error={archiveQuery.error}
        isEmpty={!items.length}
        emptyIcon="inventory_2"
        emptyTitle="لا يوجد أرشيف"
        emptyDescription="سيُحفظ سجل اشتراكاتك السابقة هنا عند إعادة الاشتراك."
      >
        {() => (
        <div className="space-y-comfortable">
          <div className="grid gap-comfortable sm:grid-cols-2">
            {items.map((item) => {
              const preserved = item.preservedData || {}
              const status = preserved.status
              const finalResult = preserved.finalResult
              const outcome = getFinalOutcome(finalResult)
              const retakeScope = preserved.retakeScope
              const canRetakeFromArchive = item.reason === 'retake' || outcome === 'failed'
              const docMeta = getArchiveDocMeta(item, outcome)

              return (
                <Card key={item._id} hoverable>
                  <div className="flex gap-4">
                    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${docMeta.color}`}>
                      <Icon name={docMeta.icon} size={28} />
                      <span className="mt-0.5 text-label-sm">{docMeta.label}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-headline-sm text-primary">
                            {item.schoolId?.name || 'مدرسة'}
                          </p>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            فئة {item.categoryCode}
                            {item.subTypeCode ? ` — ${item.subTypeCode}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {status && <StatusBadge status={status} />}
                          {outcome && (
                            <Badge variant={outcome === 'passed' ? 'success' : 'error'}>
                              {outcome === 'passed' ? 'ناجح' : 'راسب'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-label-sm text-on-surface-variant">
                        أُرشف في: {formatDate(item.archivedAt)}
                        {item.reason && ` · ${item.reason === 'retake' ? 'إعادة' : item.reason}`}
                      </p>
                      {retakeScope && (
                        <p className="mt-1 text-label-sm text-on-surface-variant">
                          نطاق الإعادة: {RETAKE_SCOPE_LABELS[retakeScope] ?? retakeScope}
                        </p>
                      )}
                      {finalResult && (
                        <div className="mt-3 flex flex-wrap gap-3 text-body-md text-on-surface-variant">
                          {finalResult.theoryScore != null && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="menu_book" size={16} />
                              النظري: {finalResult.theoryScore}%
                            </span>
                          )}
                          {finalResult.practicalScore != null && (
                            <span className="inline-flex items-center gap-1">
                              <Icon name="directions_car" size={16} />
                              العملي: {finalResult.practicalScore}%
                            </span>
                          )}
                        </div>
                      )}
                      {canRetakeFromArchive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-4"
                          onClick={() => retakeMutation.mutate(item.enrollmentId)}
                          disabled={retakeMutation.isPending}
                        >
                          <Icon name="replay" size={16} className="me-1" />
                          إعادة اشتراك
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          <p className="text-body-md text-on-surface-variant">
            بعد إنشاء طلب الإعادة،{' '}
            <Link to={ROUTES.ENROLL} className="text-primary underline">
              أكمل الدفع من صفحة الاشتراك
            </Link>
            .
          </p>
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
