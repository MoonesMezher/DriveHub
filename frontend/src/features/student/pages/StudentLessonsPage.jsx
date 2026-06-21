import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Button, Input, Badge, Icon } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const statusVariant = (status) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'error'
  return 'primary'
}

const groupLessonsByDay = (lessons) => {
  const groups = {}
  lessons.forEach((lesson) => {
    const dayKey = dayjs(lesson.scheduledAt).format('YYYY-MM-DD')
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(lesson)
  })
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
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

  const enrollmentId =
    form.enrollmentId || dashboardQuery.data?.dashboard?.enrollment?.id || ''

  const coachesQuery = useQuery({
    queryKey: ['student', 'eligible-coaches', enrollmentId],
    queryFn: async () => unwrap(await studentService.eligibleCoaches(enrollmentId)),
    enabled: Boolean(enrollmentId),
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

  const autoBookMutation = useMutation({
    mutationFn: (data) => studentService.autoBookLesson(data),
    onSuccess: () => {
      toast.success('تم الحجز التلقائي بنجاح')
      queryClient.invalidateQueries({ queryKey: ['student', 'lessons'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const lessons = lessonsQuery.data?.lessons ?? []
  const coaches = coachesQuery.data?.coaches ?? []

  const groupedLessons = useMemo(() => groupLessonsByDay(lessons), [lessons])

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

  const handleAutoBook = () => {
    if (!enrollmentId) {
      toast.error('لا يوجد اشتراك نشط')
      return
    }
    autoBookMutation.mutate({
      enrollmentId,
      durationMinutes: Number(form.durationMinutes) || 60,
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
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
              <p className="text-body-md text-on-surface-variant">جاري تحميل المدربين المؤهلين...</p>
            ) : coaches.length ? (
              <select
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md"
                value={form.coachId}
                onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}
                required
              >
                <option value="">اختر مدرباً</option>
                {coaches.map((coach) => (
                  <option key={coach.userId || coach._id} value={coach.userId || coach._id}>
                    {coach.name}
                    {coach.isFemaleCoach ? ' (مدربة)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-body-md text-on-surface-variant">
                لا يوجد مدربون مؤهلون حالياً لفئتك
              </p>
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
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={bookMutation.isPending}>
              {bookMutation.isPending ? 'جاري الحجز…' : 'حجز الموعد'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAutoBook}
              disabled={autoBookMutation.isPending || !enrollmentId}
            >
              <Icon name="auto_fix_high" size={18} className="me-1" />
              {autoBookMutation.isPending ? 'جاري البحث…' : 'حجز تلقائي'}
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
        <div className="space-y-loose">
          {groupedLessons.map(([dayKey, dayLessons]) => {
            const date = dayjs(dayKey)
            return (
              <div key={dayKey} className="relative border-s-2 border-primary/20 ps-loose">
                <div className="absolute -start-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                <div className="mb-comfortable flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                    <span className="text-label-sm">{date.format('MMM')}</span>
                    <span className="text-headline-md font-bold leading-none">{date.format('D')}</span>
                    <span className="text-label-sm">{date.format('dddd')}</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant">
                    {dayLessons.length} {dayLessons.length === 1 ? 'موعد' : 'مواعيد'}
                  </p>
                </div>
                <div className="space-y-comfortable pb-comfortable">
                  {dayLessons.map((lesson) => (
                    <Card key={lesson._id} padding="md">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                            <Icon name="schedule" size={20} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-headline-sm text-on-surface">
                              {formatDateTime(lesson.scheduledAt)}
                            </p>
                            <p className="mt-1 text-body-md text-on-surface-variant">
                              المدرب: {lesson.coachId?.name ?? '—'}
                              {lesson.durationMinutes ? ` — ${lesson.durationMinutes} د` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant={statusVariant(lesson.status)}>
                          {LESSON_STATUS_LABELS[lesson.status] ?? lesson.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
