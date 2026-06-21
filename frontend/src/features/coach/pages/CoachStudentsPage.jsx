import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Avatar, ProgressRing, Badge, Icon } from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatPhone } from '@/lib/helpers/format'

const getStudentId = (student) => student._id || student.userId

const getStudentProgress = (studentId, schedule) => {
  const studentLessons = schedule.filter(
    (l) => String(l.studentId?._id || l.studentId) === String(studentId),
  )
  if (!studentLessons.length) return { percent: 0, completed: 0, total: 0 }
  const completed = studentLessons.filter((l) => l.status === 'completed').length
  return {
    percent: Math.round((completed / studentLessons.length) * 100),
    completed,
    total: studentLessons.length,
  }
}

export const CoachStudentsPage = () => {
  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: async () => unwrap(await coachService.students()),
  })

  const scheduleQuery = useQuery({
    queryKey: ['coach', 'schedule'],
    queryFn: async () => unwrap(await coachService.schedule()),
  })

  const students = studentsQuery.data?.students ?? []
  const schedule = scheduleQuery.data?.schedule ?? []
  const isLoading = studentsQuery.isLoading || scheduleQuery.isLoading
  const error = studentsQuery.error || scheduleQuery.error

  const studentsWithProgress = useMemo(
    () => students.map((student) => ({
      ...student,
      progress: getStudentProgress(getStudentId(student), schedule),
    })),
    [students, schedule],
  )

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
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
          {studentsWithProgress.map((student) => (
            <Card key={student._id}>
              <div className="flex items-start gap-4">
                <Avatar name={student.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-headline-sm text-on-surface">{student.name}</h3>
                  {student.email && (
                    <p className="mt-1 truncate text-body-md text-on-surface-variant">{student.email}</p>
                  )}
                  {student.phone && (
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {formatPhone(student.phone)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-loose flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-comfortable">
                <ProgressRing
                  value={student.progress.percent}
                  size={52}
                  strokeWidth={5}
                  label="تقدّم الدروس"
                  sublabel={`${student.progress.completed}/${student.progress.total}`}
                />
                {student.progress.total > 0 && (
                  <Badge variant={student.progress.percent >= 80 ? 'success' : 'secondary'}>
                    {student.progress.percent >= 80 ? 'متقدّم' : 'قيد التدريب'}
                  </Badge>
                )}
              </div>
              {student.progress.total === 0 && (
                <p className="mt-3 flex items-center gap-1 text-label-sm text-on-surface-variant">
                  <Icon name="info" size={16} />
                  لا توجد دروس مسجّلة بعد
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
