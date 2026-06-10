import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card } from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatPhone } from '@/lib/helpers/format'

export const CoachStudentsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: async () => unwrap(await coachService.students()),
  })

  const students = data?.students ?? []

  return (
    <div dir="rtl">
      <PageHeader
        title="الطلاب"
        description="طلابك المسجّلون في المدرسة"
      />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!students.length}
        emptyIcon="group"
        emptyTitle="لا يوجد طلاب"
        emptyDescription="سيظهر الطلاب المرتبطون بك هنا"
      >
        {() => (
<div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student._id}>
              <h3 className="text-headline-sm text-on-surface">{student.name}</h3>
              {student.email && (
                <p className="mt-2 text-body-md text-on-surface-variant">{student.email}</p>
              )}
              {student.phone && (
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  {formatPhone(student.phone)}
                </p>
              )}
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
