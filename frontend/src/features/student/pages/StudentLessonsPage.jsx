import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import {
  PageHeader,
  AsyncContent,
  Card,
  Button,
  Input,
  Badge,
  Icon,
  ConfirmDialog,
} from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const statusVariant = (status, confirmed) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled' || status === 'no_show') return 'error'
  if (status === 'scheduled' && confirmed) return 'success'
  return 'primary'
}

const statusLabel = (lesson) => {
  if (lesson.status === 'scheduled' && lesson.confirmed) {
    return LESSON_STATUS_LABELS.confirmed
  }
  return LESSON_STATUS_LABELS[lesson.status] ?? lesson.status
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

const toDateInputValue = (value) => dayjs(value).format('YYYY-MM-DD')

export const StudentLessonsPage = () => {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState('day')
  const [date, setDate] = useState(toDateInputValue(dayjs().add(1, 'day')))
  const [femaleCoachOnly, setFemaleCoachOnly] = useState(false)
  const [selectedCoachId, setSelectedCoachId] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [searchEnabled, setSearchEnabled] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)

  const dashboardQuery = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const lessonsQuery = useQuery({
    queryKey: ['student', 'lessons'],
    queryFn: async () => unwrap(await studentService.listLessons()),
  })

  const enrollment = dashboardQuery.data?.dashboard?.enrollment
  const enrollmentId = enrollment?.id || ''

  useEffect(() => {
    if (enrollment?.prefersFemaleCoach) {
      setFemaleCoachOnly(true)
    }
  }, [enrollment?.prefersFemaleCoach])

  const enrollmentLabel = enrollment
    ? [
        enrollment.school?.name,
        `فئة ${enrollment.categoryCode}${enrollment.subTypeCode ? ` (${enrollment.subTypeCode})` : ''}`,
      ].filter(Boolean).join(' · ')
    : ''

  const availabilityQuery = useQuery({
    queryKey: ['student', 'available-coaches', enrollmentId, mode, date, femaleCoachOnly],
    queryFn: async () =>
      unwrap(
        await studentService.availableCoaches({
          enrollmentId,
          mode,
          date,
          femaleCoachOnly: femaleCoachOnly ? 'true' : 'false',
        }),
      ),
    enabled: Boolean(enrollmentId && searchEnabled && date),
  })

  const bookMutation = useMutation({
    mutationFn: (data) => studentService.bookLesson(data),
    onSuccess: () => {
      toast.success('تم حجز الموعد بنجاح')
      setSelectedCoachId('')
      setSelectedSlot('')
      setSearchEnabled(false)
      queryClient.invalidateQueries({ queryKey: ['student', 'lessons'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'available-coaches'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => studentService.cancelLesson(id),
    onSuccess: () => {
      toast.success('تم إلغاء الموعد')
      setCancelTarget(null)
      queryClient.invalidateQueries({ queryKey: ['student', 'lessons'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'available-coaches'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const lessons = lessonsQuery.data?.lessons ?? []
  const coaches = availabilityQuery.data?.coaches ?? []
  const hasActiveBooking =
    availabilityQuery.data?.hasActiveBooking
    ?? lessons.some((lesson) => lesson.status === 'scheduled')
  const activeLesson = lessons.find((lesson) => lesson.status === 'scheduled')
  const selectedCoach = coaches.find(
    (coach) => String(coach.userId || coach._id) === String(selectedCoachId),
  )
  const groupedLessons = useMemo(() => groupLessonsByDay(lessons), [lessons])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!enrollmentId) {
      toast.error('لا يوجد اشتراك نشط')
      return
    }
    if (!date) {
      toast.error('يرجى اختيار اليوم أو بداية الأسبوع')
      return
    }
    setSelectedCoachId('')
    setSelectedSlot('')
    setSearchEnabled(true)
  }

  const handleBook = () => {
    if (hasActiveBooking) {
      toast.error('لديك موعد نشط بالفعل — ألغِ الموعد الحالي أولاً')
      return
    }
    if (!enrollmentId || !selectedCoachId || !selectedSlot) {
      toast.error('اختر المدرب والوقت المتاح')
      return
    }
    bookMutation.mutate({
      enrollmentId,
      coachId: selectedCoachId,
      scheduledAt: selectedSlot,
      durationMinutes: 60,
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="المواعيد"
        description="اختر يوماً أو أسبوعاً لعرض المدربين المتاحين وحجز موعد واحد"
      />

      <Card title="حجز موعد جديد" className="mb-loose">
        {!enrollmentId ? (
          <p className="text-body-md text-on-surface-variant">لا يوجد اشتراك نشط</p>
        ) : (
          <form onSubmit={handleSearch} className="grid gap-comfortable md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-label-md text-on-surface">الاشتراك النشط</label>
              <p className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface">
                {enrollmentLabel || 'اشتراك نشط'}
              </p>
              {enrollment?.status && (
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  الحالة: {enrollment.status}
                </p>
              )}
            </div>

            {hasActiveBooking && activeLesson && (
              <div className="md:col-span-2 rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-body-md text-on-surface">
                لديك موعد نشط في {formatDateTime(activeLesson.scheduledAt)}. يجب إلغاؤه قبل حجز موعد جديد.
              </div>
            )}

            <div>
              <label className="mb-2 block text-label-md text-on-surface">نوع الفترة</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={mode === 'day' ? 'primary' : 'outline'}
                  onClick={() => {
                    setMode('day')
                    setSearchEnabled(false)
                  }}
                >
                  يوم
                </Button>
                <Button
                  type="button"
                  variant={mode === 'week' ? 'primary' : 'outline'}
                  onClick={() => {
                    setMode('week')
                    setSearchEnabled(false)
                  }}
                >
                  أسبوع
                </Button>
              </div>
            </div>

            <Input
              label={mode === 'week' ? 'بداية الأسبوع' : 'اليوم'}
              name="date"
              type="date"
              value={date}
              min={toDateInputValue(dayjs())}
              onChange={(e) => {
                setDate(e.target.value)
                setSearchEnabled(false)
              }}
              required
            />

            <label className="flex items-center gap-3 md:col-span-2 text-body-md text-on-surface">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={femaleCoachOnly}
                onChange={(e) => {
                  setFemaleCoachOnly(e.target.checked)
                  setSearchEnabled(false)
                }}
              />
              مدربة للإناث فقط
            </label>

            <div className="md:col-span-2">
              <Button type="submit" disabled={!enrollmentId || availabilityQuery.isFetching}>
                {availabilityQuery.isFetching ? 'جاري البحث…' : 'عرض المدربين المتاحين'}
              </Button>
            </div>
          </form>
        )}

        {searchEnabled && (
          <div className="mt-loose space-y-comfortable border-t border-outline-variant pt-loose">
            {availabilityQuery.isLoading ? (
              <p className="text-body-md text-on-surface-variant">جاري تحميل المدربين المتاحين...</p>
            ) : availabilityQuery.error ? (
              <p className="text-body-md text-error">{getErrorMessage(availabilityQuery.error)}</p>
            ) : !coaches.length ? (
              <p className="text-body-md text-on-surface-variant">
                لا يوجد مدربون متاحون في الفترة المحددة
              </p>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-label-md text-on-surface">المدرب المتاح</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md"
                    value={selectedCoachId}
                    onChange={(e) => {
                      setSelectedCoachId(e.target.value)
                      setSelectedSlot('')
                    }}
                    disabled={hasActiveBooking}
                  >
                    <option value="">اختر مدرباً</option>
                    {coaches.map((coach) => (
                      <option key={coach.userId || coach._id} value={coach.userId || coach._id}>
                        {coach.name}
                        {coach.isFemaleCoach ? ' (مدربة)' : ''}
                        {` — ${coach.availableSlots.length} مواعيد`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCoach && (
                  <div>
                    <label className="mb-2 block text-label-md text-on-surface">الوقت المتاح</label>
                    <select
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      disabled={hasActiveBooking}
                    >
                      <option value="">اختر وقتاً</option>
                      {selectedCoach.availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatDateTime(slot)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleBook}
                  disabled={bookMutation.isPending || hasActiveBooking || !selectedCoachId || !selectedSlot}
                >
                  {bookMutation.isPending ? 'جاري الحجز…' : 'تأكيد الحجز'}
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      <AsyncContent
        isLoading={lessonsQuery.isLoading}
        error={lessonsQuery.error}
        isEmpty={!lessons.length}
        emptyIcon="calendar_today"
        emptyTitle="لا توجد مواعيد"
        emptyDescription="اختر يوماً أو أسبوعاً ثم احجز درساً عملياً"
      >
        {() => (
          <div className="space-y-loose">
            {groupedLessons.map(([dayKey, dayLessons]) => {
              const dayDate = dayjs(dayKey)
              return (
                <div key={dayKey} className="relative border-s-2 border-primary/20 ps-loose">
                  <div className="absolute -start-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                  <div className="mb-comfortable flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                      <span className="text-label-sm">{dayDate.format('MMM')}</span>
                      <span className="text-headline-md font-bold leading-none">{dayDate.format('D')}</span>
                      <span className="text-label-sm">{dayDate.format('dddd')}</span>
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
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusVariant(lesson.status, lesson.confirmed)}>
                              {statusLabel(lesson)}
                            </Badge>
                            {lesson.status === 'scheduled' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCancelTarget(lesson)}
                              >
                                إلغاء الموعد
                              </Button>
                            )}
                          </div>
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

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="إلغاء الموعد"
        message="هل أنت متأكد من إلغاء هذا الموعد؟ يمكنك حجز موعد جديد بعد الإلغاء."
        confirmLabel={cancelMutation.isPending ? 'جاري الإلغاء…' : 'تأكيد الإلغاء'}
        cancelLabel="رجوع"
        variant="danger"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget._id)}
      />
    </div>
  )
}
