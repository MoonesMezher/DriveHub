import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, AsyncContent, StatusBadge } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'

const schoolStatusLabels = {
  active: 'نشطة',
  suspended: 'موقوفة',
}

const schoolStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const extractSchools = (payload) => {
  const node = payload?.schools
  return Array.isArray(node) ? node : node?.schools ?? []
}

export const AdminSchoolsPage = () => {
  const schoolsQuery = useQuery({
    queryKey: ['admin', 'schools'],
    queryFn: () => adminService.listSchools().then(unwrap),
  })

  const schools = extractSchools(schoolsQuery.data)

  return (
    <div>
      <PageHeader title="المدارس" description="قائمة مدارس القيادة المسجّلة في المنصة" />

      <Card>
        <AsyncContent
          isLoading={schoolsQuery.isLoading}
          error={schoolsQuery.error}
          isEmpty={schools.length === 0}
          emptyTitle="لا توجد مدارس"
        >
          {() => (
<div className="overflow-x-auto">
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                  <th className="py-3 pe-4 text-start">الاسم</th>
                  <th className="py-3 pe-4 text-start">المحافظة</th>
                  <th className="py-3 pe-4 text-start">العنوان</th>
                  <th className="py-3 pe-4 text-start">الفئات</th>
                  <th className="py-3 pe-4 text-start">الحالة</th>
                  <th className="py-3 pe-4 text-start">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school._id} className="border-b border-outline-variant/50 last:border-0">
                    <td className="py-3 pe-4 font-medium">{school.name}</td>
                    <td className="py-3 pe-4">{school.governorate || '—'}</td>
                    <td className="py-3 pe-4">{school.address || '—'}</td>
                    <td className="py-3 pe-4">{(school.licenses || []).join(', ') || '—'}</td>
                    <td className="py-3 pe-4">
                      <StatusBadge
                        status={school.status}
                        labels={schoolStatusLabels}
                        variants={schoolStatusVariants}
                      />
                    </td>
                    <td className="py-3 pe-4">{formatDate(school.createdAt)}</td>
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
