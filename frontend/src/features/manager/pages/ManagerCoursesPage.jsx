import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent, StatusBadge } from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { COURSE_STATUS_LABELS } from '@/lib/constants/statusLabels'

const courseStatusLabels = COURSE_STATUS_LABELS

export const ManagerCoursesPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [form, setForm] = useState({
    categoryCode: '',
    subTypeCode: '',
    maxStudents: '30',
    paymentDeadlineDays: '3',
  })

  const coursesQuery = useQuery({
    queryKey: ['manager', 'courses'],
    queryFn: () => managerService.listCourses().then(unwrap),
  })

  const courses = coursesQuery.data?.courses ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['manager', 'courses'] })

  const createMutation = useMutation({
    mutationFn: (data) => managerService.createCourse(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إنشاء الدورة بنجاح')
      setForm({ categoryCode: '', subTypeCode: '', maxStudents: '30', paymentDeadlineDays: '3' })
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إنشاء الدورة'),
  })

  const closeMutation = useMutation({
    mutationFn: (id) => managerService.closeCourse(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم إغلاق التسجيل')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إغلاق التسجيل'),
  })

  const launchMutation = useMutation({
    mutationFn: (id) => managerService.launchCourse(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم إطلاق الدورة')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إطلاق الدورة'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate({
      schoolId,
      categoryCode: form.categoryCode.trim().toUpperCase(),
      subTypeCode: form.subTypeCode.trim() || undefined,
      maxStudents: Number(form.maxStudents),
      paymentDeadlineDays: Number(form.paymentDeadlineDays),
    })
  }

  return (
    <div>
      <PageHeader title="إدارة الدورات" description="إنشاء دورات جديدة وإغلاق التسجيل أو إطلاق الدورة" />

      <div className="grid gap-loose xl:grid-cols-[1fr_360px]">
        <Card title="الدورات الحالية">
          <AsyncContent
            isLoading={coursesQuery.isLoading}
            error={coursesQuery.error}
            isEmpty={courses.length === 0}
            emptyTitle="لا توجد دورات مفتوحة"
            emptyDescription="أنشئ دورة جديدة لبدء استقبال طلبات الالتحاق"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">الفئة</th>
                    <th className="py-3 pe-4 text-start">الحالة</th>
                    <th className="py-3 pe-4 text-start">الطلاب</th>
                    <th className="py-3 pe-4 text-start">تاريخ الانطلاق</th>
                    <th className="py-3 pe-4 text-start">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4">
                        {course.categoryCode}
                        {course.subTypeCode ? ` (${course.subTypeCode})` : ''}
                      </td>
                      <td className="py-3 pe-4">
                        <StatusBadge
                          status={course.status}
                          labels={courseStatusLabels}
                          variants={{
                            registration_open: 'success',
                            registration_closed: 'warning',
                            active: 'primary',
                            completed: 'default',
                          }}
                        />
                      </td>
                      <td className="py-3 pe-4">
                        {course.paidCount ?? 0} / {course.maxStudents}
                      </td>
                      <td className="py-3 pe-4">{formatDate(course.launchDate) || '—'}</td>
                      <td className="py-3 pe-4">
                        <div className="flex flex-wrap gap-2">
                          {course.status === 'registration_open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closeMutation.mutate(course._id)}
                              disabled={closeMutation.isPending}
                            >
                              إغلاق التسجيل
                            </Button>
                          )}
                          {course.status === 'registration_closed' && (
                            <Button
                              size="sm"
                              onClick={() => launchMutation.mutate(course._id)}
                              disabled={launchMutation.isPending}
                            >
                              إطلاق الدورة
                            </Button>
                          )}
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

        <Card title="دورة جديدة">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="رمز الفئة"
              name="categoryCode"
              value={form.categoryCode}
              onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
              placeholder="مثال: B"
              required
            />
            <Input
              label="النوع الفرعي (اختياري)"
              name="subTypeCode"
              value={form.subTypeCode}
              onChange={(e) => setForm((f) => ({ ...f, subTypeCode: e.target.value }))}
            />
            <Input
              label="الحد الأقصى للطلاب"
              name="maxStudents"
              type="number"
              min={1}
              max={500}
              value={form.maxStudents}
              onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))}
              required
            />
            <Input
              label="مهلة الدفع (أيام)"
              name="paymentDeadlineDays"
              type="number"
              min={1}
              max={14}
              value={form.paymentDeadlineDays}
              onChange={(e) => setForm((f) => ({ ...f, paymentDeadlineDays: e.target.value }))}
            />
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              إنشاء الدورة
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
