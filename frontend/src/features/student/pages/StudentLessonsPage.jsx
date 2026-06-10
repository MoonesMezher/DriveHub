import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Button, Input, Badge } from '@/components/ui'
import { studentService, schoolService } from '@/lib/services'
import { unwrap, unwrapList } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const statusVariant = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'error'
  return 'primary'
}

export const StudentLessonsPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    enrollmentId: '',
    coachId: '',
    scheduledAt: '',
    durationMinutes: '60',
  })

  const dashboardQuery = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const lessonsQuery = useQuery({
    queryKey: ['student', 'lessons'],
    queryFn: async () => unwrap(await studentService.listLessons()),
  })

  const schoolId = dashboardQuery.data?.dashboard?.enrollment?.school?._id
    || dashboardQuery.data?.dashboard?.enrollment?.school

  const coachesQuery = useQuery({
    queryKey: ['schools', schoolId, 'coaches'],
    queryFn: async () => unwrapList(await schoolService.getCoaches(schoolId), ['coaches']),
    enabled: Boolean(schoolId),
  })

  const bookMutation = useMutation({
    mutationFn: (data) => studentService.bookLesson(data),
    onSuccess: () => {
      toast.success('تم حجز الموعد بنجاح')
      setForm((prev) => ({ ...prev, coachId: '', scheduledAt: '' }))
      queryClient.invalidateQueries({ queryKey: ['student', 'lessons'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const enrollmentId =
    form.enrollmentId || dashboardQuery.data?.dashboard?.enrollment?.id || ''

  const lessons = lessonsQuery.data?.lessons ?? []
  const coaches = coachesQuery.data ?? []

  const handleBook = (e) => {
    e.preventDefault()
    if (!enrollmentId || !form.coachId || !form.scheduledAt) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة')
      return
    }
    bookMutation.mutate({
      enrollmentId,
      coachId: form.coachId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      durationMinutes: Number(form.durationMinutes) || 60,
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="المواعيد"
        description="عرض وحجز دروس القيادة العملية"
      />

      <Card title="حجز موعد جديد" className="mb-loose">
        <form onSubmit={handleBook} className="grid gap-comfortable md:grid-cols-2">
          <Input
            label="معرّف الاشتراك"
            name="enrollmentId"
            value={enrollmentId}
            onChange={(e) => setForm((f) => ({ ...f, enrollmentId: e.target.value }))}
            hint="يُملأ تلقائياً من اشتراكك النشط"
            disabled={!!dashboardQuery.data?.dashboard?.enrollment?.id}
          />

          <div>
            <label className="mb-2 block text-label-md text-on-surface">المدرب</label>
            {coachesQuery.isLoading ? (
              <p className="text-body-md text-on-surface-variant">جاري تحميل المدربين...</p>
            ) : coaches.length ? (
              <select
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md"
                value={form.coachId}
                onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}
                required
              >
                <option value="">اختر مدرباً</option>
                {coaches.map((coach) => (
                  <option key={coach._id} value={coach._id}>
                    {coach.name}
                    {coach.isFemaleCoach ? ' (مدربة)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                label=""
                name="coachId"
                value={form.coachId}
                onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}
                hint="لا يوجد مدربون — أدخل المعرّف يدوياً"
                required
              />
            )}
          </div>

          <Input
            label="التاريخ والوقت"
            name="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            required
          />
          <Input
            label="المدة (دقيقة)"
            name="durationMinutes"
            type="number"
            min={30}
            max={120}
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={bookMutation.isPending}>
              {bookMutation.isPending ? 'جاري الحجز…' : 'حجز الموعد'}
            </Button>
          </div>
        </form>
      </Card>

      <AsyncContent
        isLoading={lessonsQuery.isLoading}
        error={lessonsQuery.error}
        isEmpty={!lessons.length}
        emptyIcon="calendar_today"
        emptyTitle="لا توجد مواعيد"
        emptyDescription="احجز درساً عملياً للبدء"
      >
        {() => (
<div className="space-y-comfortable">
          {lessons.map((lesson) => (
            <Card key={lesson._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-headline-sm text-on-surface">
                    {formatDateTime(lesson.scheduledAt)}
                  </p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    المدرب: {lesson.coachId?.name ?? '—'}
                    {lesson.durationMinutes ? ` — ${lesson.durationMinutes} د` : ''}
                  </p>
                </div>
                <Badge variant={statusVariant(lesson.status)}>
                  {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
