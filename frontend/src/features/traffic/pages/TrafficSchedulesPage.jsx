import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, Select, GovernorateSelect, StatusBadge,
} from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { EXAM_TYPE_LABELS } from '@/lib/constants/statusLabels'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 10

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

const EXAM_TYPE_OPTIONS = [
  { value: 'theory', label: 'نظري' },
  { value: 'practical', label: 'عملي' },
]

const enrollmentLabel = (entry) => {
  const name = entry.userId?.name || 'طالب'
  const school = entry.schoolId?.name || ''
  const category = entry.categoryCode || ''
  return `${name} — ${category}${entry.subTypeCode ? ` (${entry.subTypeCode})` : ''}${school ? ` · ${school}` : ''}`
}

export const TrafficSchedulesPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)

  const [form, setForm] = useState({
    governorate: '',
    enrollmentId: '',
    examType: 'theory',
    examDate: '',
    branch: '',
  })

  const enrollmentsQuery = useQuery({
    queryKey: ['traffic', 'enrollments'],
    queryFn: () => trafficService.listEnrollments().then(unwrap),
  })

  const schedulesQuery = useQuery({
    queryKey: ['traffic', 'schedules'],
    queryFn: () => trafficService.listSchedules().then(unwrap),
  })

  const schedules = schedulesQuery.data?.schedules ?? []
  const enrollments = enrollmentsQuery.data?.enrollments ?? []

  const enrollmentOptions = enrollments.map((entry) => ({
    value: entry._id,
    label: enrollmentLabel(entry),
  }))

  const totalPages = Math.max(1, Math.ceil(schedules.length / PAGE_SIZE))
  const paginatedSchedules = schedules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const createMutation = useMutation({
    mutationFn: (data) => trafficService.createSchedule(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إنشاء الموعد')
      setForm({
        governorate: '',
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
    const enrollment = enrollments.find((entry) => entry._id === form.enrollmentId)
    if (!enrollment) {
      toast.error('اختر اشتراكاً')
      return
    }
    const studentId = enrollment.userId?._id || enrollment.userId
    createMutation.mutate({
      governorate: form.governorate.trim(),
      studentId: String(studentId),
      enrollmentId: form.enrollmentId,
      examType: form.examType,
      examDate: new Date(form.examDate).toISOString(),
      branch: form.branch.trim(),
    })
  }

  const columns = useMemo(() => [
    {
      key: 'student',
      label: 'الطالب',
      render: (schedule) => schedule.studentId?.name || schedule.studentId || '—',
    },
    {
      key: 'examType',
      label: 'النوع',
      render: (schedule) => EXAM_TYPE_LABELS[schedule.examType] || schedule.examType,
    },
    {
      key: 'examDate',
      label: 'التاريخ',
      render: (schedule) => formatDate(schedule.examDate, 'YYYY/MM/DD HH:mm'),
    },
    { key: 'governorate', label: 'المحافظة', render: (s) => s.governorate || '—' },
    { key: 'branch', label: 'الفرع', render: (s) => s.branch || '—' },
    {
      key: 'status',
      label: 'الحالة',
      render: (schedule) => (
        <StatusBadge
          status={schedule.status}
          labels={scheduleStatusLabels}
          variants={scheduleStatusVariants}
        />
      ),
    },
  ], [])

  return (
    <div>
      <PageHeader
        variant="compact"
        title="مواعيد الامتحان"
        description="عرض المواعيد المجدولة وإنشاء موعد جديد"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="المواعيد" padding="none">
          {schedulesQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={6} cols={6} /></div>
          ) : schedulesQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(schedulesQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginatedSchedules} emptyLabel="لا توجد مواعيد" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card title="موعد جديد" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleCreate}>
            <FormSection>
              <GovernorateSelect
                value={form.governorate}
                onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))}
                required
                allowEmpty={false}
              />
              <Select
                label="الاشتراك / الطالب"
                placeholder="— اختر اشتراكاً —"
                value={form.enrollmentId}
                onChange={(e) => setForm((f) => ({ ...f, enrollmentId: e.target.value }))}
                options={enrollmentOptions}
                required
              />
              <Select
                label="نوع الامتحان"
                value={form.examType}
                onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}
                options={EXAM_TYPE_OPTIONS}
              />
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
              <Button type="submit" className="w-full" disabled={createMutation.isPending || enrollmentsQuery.isLoading}>
                إنشاء الموعد
              </Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
