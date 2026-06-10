import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, StatusBadge } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'

export const StudentArchivePage = () => {
  const archiveQuery = useQuery({
    queryKey: ['student', 'archive'],
    queryFn: async () => unwrap(await studentService.archive()),
  })

  const items = archiveQuery.data?.archive ?? []

  return (
    <div dir="rtl">
      <PageHeader
        title="أرشيف الاشتراكات"
        description="سجل اشتراكاتك السابقة عند إعادة التسجيل لفئة جديدة"
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
          {items.map((item) => (
            <Card key={item._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-headline-sm text-primary">
                    {item.schoolId?.name || 'مدرسة'}
                  </p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    فئة {item.categoryCode}
                    {item.subTypeCode ? ` — ${item.subTypeCode}` : ''}
                  </p>
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    أُرشف في: {formatDate(item.archivedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status && <StatusBadge status={item.status} />}
                  {item.finalResult && (
                    <Badge variant={item.finalResult === 'passed' ? 'success' : 'error'}>
                      {item.finalResult === 'passed' ? 'ناجح' : 'راسب'}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
