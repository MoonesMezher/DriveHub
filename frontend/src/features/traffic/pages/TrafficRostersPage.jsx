import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, AsyncContent, StatusBadge } from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'

const rosterStatusLabels = {
  draft: 'مسودة',
  submitted: 'مُرسَل',
  distributed: 'موزّع',
}

const rosterStatusVariants = {
  draft: 'default',
  submitted: 'warning',
  distributed: 'success',
}

export const TrafficRostersPage = () => {
  const rostersQuery = useQuery({
    queryKey: ['traffic', 'rosters'],
    queryFn: () => trafficService.listRosters().then(unwrap),
  })

  const rosters = rostersQuery.data?.rosters ?? []

  return (
    <div>
      <PageHeader
        title="قوائم الطلاب"
        description="القوائم الموزّعة من المدارس للامتحان"
      />

      <Card>
        <AsyncContent
          isLoading={rostersQuery.isLoading}
          error={rostersQuery.error}
          isEmpty={rosters.length === 0}
          emptyTitle="لا توجد قوائم موزّعة"
        >
          {() => (
<div className="overflow-x-auto">
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                  <th className="py-3 pe-4 text-start">المدرسة</th>
                  <th className="py-3 pe-4 text-start">الفئة</th>
                  <th className="py-3 pe-4 text-start">عدد الطلاب</th>
                  <th className="py-3 pe-4 text-start">دفعة المرور</th>
                  <th className="py-3 pe-4 text-start">الحالة</th>
                  <th className="py-3 pe-4 text-start">تاريخ الإرسال</th>
                </tr>
              </thead>
              <tbody>
                {rosters.map((roster) => (
                  <tr key={roster._id} className="border-b border-outline-variant/50 last:border-0">
                    <td className="py-3 pe-4">{roster.schoolId?.name || '—'}</td>
                    <td className="py-3 pe-4">
                      {roster.courseId?.categoryCode || '—'}
                      {roster.courseId?.subTypeCode ? ` (${roster.courseId.subTypeCode})` : ''}
                    </td>
                    <td className="py-3 pe-4">{roster.studentIds?.length ?? 0}</td>
                    <td className="py-3 pe-4">{roster.trafficBatchId || '—'}</td>
                    <td className="py-3 pe-4">
                      <StatusBadge
                        status={roster.status}
                        labels={rosterStatusLabels}
                        variants={rosterStatusVariants}
                      />
                    </td>
                    <td className="py-3 pe-4">{formatDate(roster.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          )}
        </AsyncContent>
      </Card>
    </div>
  )
}
