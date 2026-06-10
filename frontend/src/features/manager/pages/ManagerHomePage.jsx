import { useQuery } from '@tanstack/react-query'
import { PageHeader, StatCard, AsyncContent } from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { COURSE_STATUS_LABELS } from '@/lib/constants/statusLabels'

export const ManagerHomePage = () => {
  const coursesQuery = useQuery({
    queryKey: ['manager', 'courses'],
    queryFn: () => managerService.listCourses().then(unwrap),
  })

  const instructorsQuery = useQuery({
    queryKey: ['manager', 'instructors'],
    queryFn: () => managerService.listInstructors().then(unwrap),
  })

  const isLoading = coursesQuery.isLoading || instructorsQuery.isLoading
  const error = coursesQuery.error || instructorsQuery.error

  const courses = coursesQuery.data?.courses ?? []
  const instructors = instructorsQuery.data?.instructors ?? []
  const openCourses = courses.filter((c) => c.registrationOpen).length
  const totalCapacity = courses.reduce((sum, c) => sum + (c.maxStudents || 0), 0)
  const activeInstructors = instructors.filter((i) => i.status === 'active').length

  return (
    <div>
      <PageHeader
        title="لوحة مدير المدرسة"
        description="نظرة عامة على الدورات والمدربين وطلبات الالتحاق"
      />

      <AsyncContent isLoading={isLoading} error={error} isEmpty={false}>
        {() => (
          <div className="space-y-loose">
            <div className="grid gap-comfortable sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="دورات مفتوحة للتسجيل" value={openCourses} icon="school" />
              <StatCard label="إجمالي السعة" value={totalCapacity} icon="group" />
              <StatCard label="المدربون النشطون" value={activeInstructors} icon="supervisor_account" />
              <StatCard label="إجمالي الدورات" value={courses.length} icon="menu_book" />
            </div>

            {courses.length > 0 && (
              <div className="grid gap-comfortable lg:grid-cols-2">
                {courses.slice(0, 4).map((course) => (
                  <div
                    key={course._id}
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest p-comfortable shadow-card"
                  >
                    <p className="text-label-sm text-on-surface-variant">فئة {course.categoryCode}</p>
                    <p className="mt-1 text-headline-sm text-on-surface">
                      {COURSE_STATUS_LABELS[course.status] || course.status}
                    </p>
                    <p className="mt-2 text-body-md text-on-surface-variant">
                      {course.paidCount ?? 0} / {course.maxStudents} طالب
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AsyncContent>
    </div>
  )
}
