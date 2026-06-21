import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import {
  PageHeader, AsyncContent, Card, Button, Badge, Input, RatingStars, Textarea, Icon,
} from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatDateTime } from '@/lib/helpers/date'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

export const CoachLessonsPage = () => {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState(null)
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('completed')

  const { data, isLoading, error } = useQuery({
    queryKey: ['coach', 'schedule', 'lessons'],
    queryFn: async () => unwrap(await coachService.schedule()),
  })

  const lessons = (data?.schedule ?? []).filter((l) => l.status === 'scheduled')

  const selected = lessons.find((l) => l._id === selectedId) || lessons[0]

  const complete = useMutation({
    mutationFn: (payload) => coachService.completeLesson(payload.id, payload.body),
    onSuccess: () => {
      toast.success('تم حفظ تقييم الدرس')
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['coach'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="تقييم الدرس العملي"
        description="يرجى ملء استمارة التقييم بدقة لضمان متابعة تقدم الطالب"
      />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!lessons.length}
        emptyIcon="event_busy"
        emptyTitle="لا توجد دروس بانتظار التقييم"
        emptyDescription="ستظهر الدروس المجدولة هنا عند حجز الطلاب"
      >
        {() => (
        <div className="grid gap-loose lg:grid-cols-[minmax(0,320px)_1fr]">
          <Card title="دروس بانتظار التقييم" padding="md" className="h-fit lg:sticky lg:top-4">
            <div className="space-y-comfortable">
              {lessons.map((lesson) => (
                <button
                  key={lesson._id}
                  type="button"
                  onClick={() => setSelectedId(lesson._id)}
                  className={cn(
                    'w-full rounded-xl border p-comfortable text-start transition-all',
                    selected?._id === lesson._id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-outline-variant/60 hover:border-primary/40',
                  )}
                >
                  <p className="text-headline-sm text-on-surface">{formatDateTime(lesson.scheduledAt)}</p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {lesson.studentId?.name ?? 'طالب'}
                  </p>
                  <Badge variant="primary" className="mt-2">
                    {LESSON_STATUS_LABELS[lesson.status]}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          {selected && (
            <Card title="استمارة التقييم" padding="lg">
              <div className="mb-loose flex items-center gap-3 rounded-xl bg-surface-container-low p-comfortable">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container">
                  <Icon name="person" size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-headline-sm text-on-surface">{selected.studentId?.name ?? 'طالب'}</p>
                  <p className="text-body-md text-on-surface-variant">{formatDateTime(selected.scheduledAt)}</p>
                </div>
              </div>

              <div className="grid gap-gutter md:grid-cols-2">
                <Input
                  label="اسم الطالب"
                  value={selected.studentId?.name ?? ''}
                  readOnly
                  disabled
                />
                <Input
                  label="الموعد"
                  value={formatDateTime(selected.scheduledAt)}
                  readOnly
                  disabled
                />
              </div>

              <div className="mt-loose rounded-xl border border-outline-variant bg-surface-container-low p-comfortable">
                <h3 className="mb-comfortable text-label-md text-primary">التقييم العام</h3>
                <RatingStars value={rating} onChange={setRating} />
                <p className="mt-2 text-label-sm text-on-surface-variant">{rating} من 5</p>
              </div>

              <div className="mt-comfortable">
                <label className="mb-2 block text-label-md text-on-surface">حالة الدرس</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'completed', label: 'مكتمل' },
                    { id: 'no_show', label: 'لم يحضر' },
                    { id: 'cancelled', label: 'ملغى' },
                  ].map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      size="sm"
                      variant={status === opt.id ? 'primary' : 'outline'}
                      onClick={() => setStatus(opt.id)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Textarea
                label="ملاحظات وتوصيات المدرب"
                id="coach-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="نقاط القوة والمجالات التي تحتاج تحسيناً..."
                className="mt-comfortable"
              />

              <div className="mt-loose flex flex-wrap gap-3 border-t border-outline-variant pt-comfortable">
                <Button
                  onClick={() =>
                    complete.mutate({
                      id: selected._id,
                      body: { status, rating: status === 'completed' ? rating : undefined, coachNotes: notes },
                    })
                  }
                  disabled={complete.isPending}
                >
                  {complete.isPending ? 'جاري الحفظ…' : 'حفظ التقييم'}
                </Button>
                <Button variant="outline" onClick={() => { setNotes(''); setRating(4) }}>
                  إعادة تعيين
                </Button>
              </div>
            </Card>
          )}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
