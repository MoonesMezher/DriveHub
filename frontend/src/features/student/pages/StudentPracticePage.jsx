import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import {
  PageHeader,
  AsyncContent,
  Card,
  Button,
  Badge,
  ProgressRing,
  Icon,
  Alert,
} from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'

const PASS_THRESHOLD = 70

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ']

export const StudentPracticePage = () => {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const submitRef = useRef(null)
  const autoSubmittedRef = useRef(false)

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
      setResult(null)
      autoSubmittedRef.current = false
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + (data.durationSeconds ?? 1800) * 1000
      setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)))
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
      setSecondsLeft(null)
      toast.success(`النتيجة: ${data.score}% — ${data.passed ? 'ناجح' : 'راسب'}`)
      queryClient.invalidateQueries({ queryKey: ['student', 'practice'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const exams = historyQuery.data?.exams ?? []
  const passThreshold = session?.passThreshold ?? PASS_THRESHOLD
  const alreadyPassed = exams.some((e) => e.passed)
  const questions = session?.questions ?? []
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  const buildSubmitPayload = useCallback(() => {
    if (!session) return null
    const answerPayload = questions.map((q) => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] ?? null,
    }))
    return {
      sessionId: session.sessionId,
      answers: answerPayload,
    }
  }, [session, questions, answers])

  const handleSubmit = useCallback((auto = false) => {
    if (!session || submitMutation.isPending) return
    const payload = buildSubmitPayload()
    if (!payload) return
    if (!auto && answeredCount === 0) return
    submitMutation.mutate(payload)
  }, [session, submitMutation, buildSubmitPayload, answeredCount])

  submitRef.current = handleSubmit

  useEffect(() => {
    if (!session || secondsLeft == null) return undefined

    const tick = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 0) return 0
        const next = prev - 1
        if (next <= 0 && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true
          submitRef.current?.(true)
        }
        return Math.max(0, next)
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [session, secondsLeft])

  const handleExit = () => {
    if (!session) return
    const confirmed = window.confirm(
      'الخروج سيُرسِل إجاباتك الحالية ويُنهي الاختبار. هل تريد المتابعة؟',
    )
    if (confirmed) handleSubmit(true)
  }

  const selectAnswer = (questionId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
  }

  if (result) {
    return (
      <div dir="rtl">
        <PageHeader
          variant="compact"
          title="نتيجة الاختبار"
          description={`${result.score}% — ${result.passed ? 'ناجح' : 'راسب'} (حد النجاح ${result.passThreshold ?? passThreshold}%)`}
          actions={
            <Button onClick={() => setResult(null)}>العودة للقائمة</Button>
          }
        />

        <Alert
          variant={result.passed ? 'success' : 'error'}
          title={result.passed ? 'تهانينا! لقد نجحت' : 'لم تصل لحد النجاح'}
          className="mb-loose"
        >
          {result.passed
            ? 'يمكنك الآن الاستعداد لامتحان المرور الرسمي.'
            : 'راجع إجاباتك أدناه وحاول مرة أخرى.'}
        </Alert>

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
    const timerUrgent = secondsLeft != null && secondsLeft <= 60

    return (
      <div dir="rtl">
        <PageHeader
          variant="compact"
          title="اختبار تجريبي"
          description={`المحاولة ${session.attempt ?? 1} — ${questions.length} سؤال — حد النجاح ${passThreshold}%`}
          actions={
            <Button variant="ghost" onClick={handleExit}>
              إنهاء وإرسال
            </Button>
          }
        />

        <div className="mb-loose flex flex-wrap items-center justify-between gap-comfortable">
          <ProgressRing value={progress} label="الإجابات" sublabel={`${answeredCount} / ${questions.length}`} />
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-3 text-headline-sm',
              timerUrgent ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface',
            )}
          >
            <Icon name="timer" size={24} />
            <span>{secondsLeft != null ? formatCountdown(secondsLeft) : '—'}</span>
          </div>
        </div>

        {timerUrgent && (
          <Alert variant="warning" title="الوقت ينفد" className="mb-loose">
            أقل من دقيقة متبقية — سيتم إرسال إجاباتك تلقائياً.
          </Alert>
        )}

        <div className="mb-loose flex flex-wrap justify-center gap-2">
          {questions.map((q, index) => (
            <button
              key={q._id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`السؤال ${index + 1}`}
              aria-current={index === currentIndex ? 'step' : undefined}
              className={cn(
                'h-3 w-3 rounded-full transition-all',
                index === currentIndex && 'scale-125 ring-2 ring-primary ring-offset-2',
                answers[q._id] ? 'bg-primary' : 'bg-outline-variant',
              )}
            />
          ))}
        </div>

        {currentQuestion && (
          <Card title={`السؤال ${currentIndex + 1} من ${questions.length}`}>
            <p className="mb-4 text-body-lg text-on-surface">{currentQuestion.text}</p>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt=""
                className="mb-4 max-h-48 rounded-lg object-contain"
              />
            )}
            <div className="space-y-2">
              {(currentQuestion.options ?? []).map((option, optIndex) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectAnswer(currentQuestion._id, option.key)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-comfortable text-start text-body-md transition-all',
                    answers[currentQuestion._id] === option.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low',
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-label-md font-semibold">
                    {OPTION_LABELS[optIndex] ?? option.key}
                  </span>
                  <span className="pt-1">{option.text}</span>
                </button>
              ))}
            </div>

            <div className="mt-loose flex flex-wrap gap-3 border-t border-outline-variant/50 pt-comfortable">
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
                  onClick={() => handleSubmit(false)}
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
        description={`تدرّب على أسئلة الامتحان قبل الموعد الرسمي — حد النجاح ${passThreshold}%`}
        actions={
          !alreadyPassed && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? 'جاري التحضير…' : 'بدء اختبار جديد'}
            </Button>
          )
        }
      />

      {alreadyPassed && (
        <Alert variant="success" title="لقد نجحت في الاختبار التجريبي" className="mb-loose">
          لا يمكن بدء محاولة جديدة بعد النجاح. راجع محاولاتك السابقة أدناه.
        </Alert>
      )}

      <AsyncContent
        isLoading={historyQuery.isLoading}
        error={historyQuery.error}
        isEmpty={!exams.length}
        emptyIcon="quiz"
        emptyTitle="لا توجد محاولات سابقة"
        emptyDescription={
          alreadyPassed
            ? 'تم تسجيل نجاحك — لا حاجة لمحاولات إضافية'
            : 'ابدأ اختباراً تجريبياً لتسجيل محاولتك الأولى'
        }
        emptyAction={
          !alreadyPassed
            ? { label: 'بدء اختبار', onClick: () => startMutation.mutate() }
            : undefined
        }
      >
        {() => (
        <div className="space-y-comfortable">
          {exams.map((exam) => (
            <Card key={exam._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProgressRing value={exam.score ?? 0} size={48} strokeWidth={4} />
                  <div>
                    <p className="text-headline-sm text-on-surface">
                      النتيجة: {exam.score ?? '—'}%
                    </p>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      {formatDateTime(exam.completedAt ?? exam.createdAt)}
                    </p>
                  </div>
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
