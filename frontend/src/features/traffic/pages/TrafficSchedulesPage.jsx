import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent, StatusBadge } from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { EXAM_TYPE_LABELS } from '@/lib/constants/statusLabels'
import { useToast } from '@/hooks/useToast'

const scheduleStatusLabels = {
  scheduled: 'مجدول',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  no_show: 'لم يحضر',
}

const scheduleStatusVariants = {
  scheduled: 'primary',
  completed: 'success',
  cancelled: 'error',
  no_show: 'warning',
}

export const TrafficSchedulesPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    governorate: '',
    studentId: '',
    enrollmentId: '',
    examType: 'theory',
    examDate: '',
    branch: '',
  })

  const schedulesQuery = useQuery({
    queryKey: ['traffic', 'schedules'],
    queryFn: () => trafficService.listSchedules().then(unwrap),
  })

  const schedules = schedulesQuery.data?.schedules ?? []

  const createMutation = useMutation({
    mutationFn: (data) => trafficService.createSchedule(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إنشاء الموعد')
      setForm({
        governorate: '',
        studentId: '',
        enrollmentId: '',
        examType: 'theory',
        examDate: '',
        branch: '',
      })
      queryClient.invalidateQueries({ queryKey: ['traffic', 'schedules'] })
    },
    onError: (err) => toast.error(err, 'فشل إنشاء الموعد'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate({
      governorate: form.governorate.trim(),
      studentId: form.studentId.trim(),
      enrollmentId: form.enrollmentId.trim(),
      examType: form.examType,
      examDate: new Date(form.examDate).toISOString(),
      branch: form.branch.trim(),
    })
  }

  return (
    <div>
      <PageHeader
        title="مواعيد الامتحان"
        description="عرض المواعيد المجدولة وإنشاء موعد جديد"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_360px]">
        <Card title="المواعيد">
          <AsyncContent
            isLoading={schedulesQuery.isLoading}
            error={schedulesQuery.error}
            isEmpty={schedules.length === 0}
            emptyTitle="لا توجد مواعيد"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">الطالب</th>
                    <th className="py-3 pe-4 text-start">النوع</th>
                    <th className="py-3 pe-4 text-start">التاريخ</th>
                    <th className="py-3 pe-4 text-start">المحافظة</th>
                    <th className="py-3 pe-4 text-start">الفرع</th>
                    <th className="py-3 pe-4 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4">{schedule.studentId?.name || schedule.studentId || '—'}</td>
                      <td className="py-3 pe-4">{EXAM_TYPE_LABELS[schedule.examType] || schedule.examType}</td>
                      <td className="py-3 pe-4">{formatDate(schedule.examDate, 'YYYY/MM/DD HH:mm')}</td>
                      <td className="py-3 pe-4">{schedule.governorate || '—'}</td>
                      <td className="py-3 pe-4">{schedule.branch || '—'}</td>
                      <td className="py-3 pe-4">
                        <StatusBadge
                          status={schedule.status}
                          labels={scheduleStatusLabels}
                          variants={scheduleStatusVariants}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            )}
          </AsyncContent>
        </Card>

        <Card title="موعد جديد">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="المحافظة"
              value={form.governorate}
              onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))}
              required
            />
            <Input
              label="معرّف الطالب"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              required
            />
            <Input
              label="معرّف الاشتراك"
              value={form.enrollmentId}
              onChange={(e) => setForm((f) => ({ ...f, enrollmentId: e.target.value }))}
              required
            />
            <div className="space-y-2">
              <label htmlFor="examType" className="block text-label-md text-on-surface">
                نوع الامتحان
              </label>
              <select
                id="examType"
                value={form.examType}
                onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
              >
                <option value="theory">نظري</option>
                <option value="practical">عملي</option>
              </select>
            </div>
            <Input
              label="تاريخ ووقت الامتحان"
              type="datetime-local"
              value={form.examDate}
              onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
              required
            />
            <Input
              label="الفرع"
              value={form.branch}
              onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
              required
            />
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              إنشاء الموعد
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
