import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  PageHeader,
  AsyncContent,
  Card,
  Button,
  Badge,
  ProgressRing,
  Icon,
} from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'

export const StudentPracticePage = () => {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [startedAt, setStartedAt] = useState(null)
  const [result, setResult] = useState(null)

  const historyQuery = useQuery({
    queryKey: ['student', 'practice'],
    queryFn: async () => unwrap(await studentService.listPractice()),
  })

  const startMutation = useMutation({
    mutationFn: async () => unwrap(await studentService.startPractice({})),
    onSuccess: (data) => {
      setSession(data)
      setCurrentIndex(0)
      setAnswers({})
      setStartedAt(Date.now())
      setResult(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const submitMutation = useMutation({
    mutationFn: (payload) => studentService.submitPractice(payload),
    onSuccess: (res) => {
      const data = unwrap(res)
      setResult(data)
      setSession(null)
      setAnswers({})
      toast.success(`النتيجة: ${data.score}% — ${data.passed ? 'ناجح' : 'راسب'}`)
      queryClient.invalidateQueries({ queryKey: ['student', 'practice'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const exams = historyQuery.data?.exams ?? []
  const questions = session?.questions ?? []
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  const selectAnswer = (questionId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
  }

  const handleSubmit = () => {
    if (!session) return
    const durationSeconds = startedAt
      ? Math.round((Date.now() - startedAt) / 1000)
      : session.durationSeconds ?? 0

    const answerPayload = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] ?? null,
    }))

    submitMutation.mutate({
      attempt: session.attempt ?? 1,
      durationSeconds,
      answers: answerPayload,
    })
  }

  if (result) {
    return (
      <div dir="rtl">
        <PageHeader
          title="نتيجة الاختبار"
          description={`${result.score}% — ${result.passed ? 'ناجح' : 'راسب'}`}
          actions={
            <Button onClick={() => setResult(null)}>العودة للقائمة</Button>
          }
        />

        <div className="space-y-comfortable">
          {(result.review ?? []).map((item, index) => (
            <Card key={item.questionId || index} title={`السؤال ${index + 1}`}>
              <p className="mb-3 text-body-lg text-on-surface">{item.text}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={item.isCorrect ? 'success' : 'error'}>
                  {item.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                </Badge>
                {item.selectedAnswer && (
                  <Badge variant="secondary">اختيارك: {item.selectedAnswer}</Badge>
                )}
                {item.correctAnswer && (
                  <Badge variant="primary">الصحيح: {item.correctAnswer}</Badge>
                )}
              </div>
              {item.explanation && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-container p-comfortable text-body-md text-on-surface-variant">
                  <Icon name="lightbulb" size={20} className="shrink-0 text-secondary" />
                  {item.explanation}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (session) {
    return (
      <div dir="rtl">
        <PageHeader
          title="اختبار تجريبي"
          description={`المحاولة ${session.attempt ?? 1} — ${questions.length} سؤال`}
          actions={
            <Button variant="ghost" onClick={() => setSession(null)}>
              إلغاء
            </Button>
          }
        />

        <div className="mb-loose">
          <ProgressRing value={progress} label="الإجابات" sublabel={`${answeredCount} / ${questions.length}`} />
        </div>

        {currentQuestion && (
          <Card title={`السؤال ${currentIndex + 1}`}>
            <p className="mb-4 text-body-lg text-on-surface">{currentQuestion.text}</p>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt=""
                className="mb-4 max-h-48 rounded-lg object-contain"
              />
            )}
            <div className="space-y-2">
              {(currentQuestion.options ?? []).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectAnswer(currentQuestion._id, option.key)}
                  className={`w-full rounded-lg border p-comfortable text-start text-body-md transition-all ${
                    answers[currentQuestion._id] === option.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant hover:border-primary/50'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>

            <div className="mt-loose flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                السابق
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex((i) => i + 1)}>التالي</Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || answeredCount === 0}
                >
                  {submitMutation.isPending ? 'جاري الإرسال…' : 'إرسال الاختبار'}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="اختبارات تجريبية"
        description="تدرّب على أسئلة الامتحان قبل الموعد الرسمي"
        actions={
          <Button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? 'جاري التحضير…' : 'بدء اختبار جديد'}
          </Button>
        }
      />

      <AsyncContent
        isLoading={historyQuery.isLoading}
        error={historyQuery.error}
        isEmpty={!exams.length}
        emptyIcon="quiz"
        emptyTitle="لا توجد محاولات سابقة"
        emptyDescription="ابدأ اختباراً تجريبياً لتسجيل محاولتك الأولى"
        emptyAction={{
          label: 'بدء اختبار',
          onClick: () => startMutation.mutate(),
        }}
      >
        {() => (
        <div className="space-y-comfortable">
          {exams.map((exam) => (
            <Card key={exam._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-headline-sm text-on-surface">
                    النتيجة: {exam.score ?? '—'}%
                  </p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    {formatDateTime(exam.completedAt ?? exam.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={exam.passed ? 'success' : 'error'}>
                    {exam.passed ? 'ناجح' : 'راسب'}
                  </Badge>
                  {exam.categoryCode && (
                    <Badge variant="default">فئة {exam.categoryCode}</Badge>
                  )}
                  {exam.attempt != null && (
                    <Badge variant="secondary">محاولة {exam.attempt}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
