import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, Button, Badge, Icon, AsyncContent } from '@/components/ui'
import { contentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { ROUTES } from '@/lib/constants/routes'
import { useAuthContext } from '@/app/providers/AuthProvider'

export const SamplePage = () => {
  const { isAuthenticated } = useAuthContext()
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const sampleQuery = useQuery({
    queryKey: ['content', 'sample', isAuthenticated],
    queryFn: async () => unwrap(await contentService.getSample({ category: 'B' })),
  })

  const questions = sampleQuery.data?.questions ?? []

  const pick = (qId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionKey }))
    setRevealed((prev) => ({ ...prev, [qId]: true }))
  }

  const score = questions.filter(
    (q) => answers[q._id] === q.correctAnswer,
  ).length

  return (
    <div dir="rtl">
      <PageHeader
        title="عينة مجانية — نظري"
        description={
          isAuthenticated
            ? 'عينة كاملة للمستخدمين المسجّلين — مع الحلول بعد كل إجابة'
            : 'جرّب 3 أسئلة تفاعلية قبل التسجيل الكامل'
        }
        actions={
          !isAuthenticated && (
            <Link to={ROUTES.REGISTER}>
              <Button>التسجيل للوصول الكامل</Button>
            </Link>
          )
        }
      />

      <div className="section-hero mb-loose p-loose">
        <Badge variant="secondary" className="mb-3 bg-secondary-container text-on-secondary-container">
          {sampleQuery.data?.tier === 'full' ? 'عينة كاملة' : 'معاينة مجانية'}
        </Badge>
        <p className="text-body-lg text-on-primary-container">
          بعد التسجيل والاشتراك: بنك أسئلة كامل، محاكاة امتحان، ومحتوى نظري تفاعلي.
        </p>
        {Object.keys(revealed).length === questions.length && questions.length > 0 && (
          <p className="mt-4 text-headline-sm text-on-primary">
            نتيجتك: {score} / {questions.length}
          </p>
        )}
      </div>

      <AsyncContent
        isLoading={sampleQuery.isLoading}
        error={sampleQuery.error}
        isEmpty={!questions.length}
        emptyIcon="quiz"
        emptyTitle="لا توجد عينة متاحة"
        emptyDescription="شغّل seed:content في الخادم لتحميل المحتوى التجريبي."
      >
        {() => (
<div className="space-y-comfortable">
          {questions.map((q, index) => {
            const chosen = answers[q._id]
            const show = revealed[q._id]
            return (
              <Card key={q._id} title={`سؤال ${index + 1}`}>
                <p className="mb-4 text-body-lg text-on-surface">{q.text}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(q.options ?? []).map((option) => {
                    const isCorrect = option.key === q.correctAnswer
                    const isChosen = chosen === option.key
                    let cls = 'border-outline-variant bg-surface-container-low hover:border-primary'
                    if (show && isChosen && isCorrect) cls = 'border-success bg-success-container/30'
                    if (show && isChosen && !isCorrect) cls = 'border-error bg-error-container/30'
                    if (show && !isChosen && isCorrect) cls = 'border-success/50 bg-success-container/10'
                    return (
                      <button
                        key={option.key}
                        type="button"
                        disabled={show}
                        className={`rounded-lg border px-4 py-3 text-start text-body-md transition-colors ${cls}`}
                        onClick={() => pick(q._id, option.key)}
                      >
                        <span className="me-2 font-medium text-primary">{option.key}.</span>
                        {option.text}
                      </button>
                    )
                  })}
                </div>
                {show && q.explanation && (
                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-container p-comfortable text-body-md text-on-surface-variant">
                    <Icon name="lightbulb" size={20} className="shrink-0 text-secondary" />
                    {q.explanation}
                  </p>
                )}
              </Card>
            )
          })}
        </div>

        )}
      </AsyncContent>

      <Card className="mt-loose text-center">
        <Icon name="auto_stories" size={40} className="mx-auto mb-4 text-primary" />
        <h3 className="text-headline-sm text-primary">هل أعجبتك العينة؟</h3>
        <p className="mt-2 text-body-md text-on-surface-variant">
          سجّل حساباً مجانياً للوصول إلى المحتوى الكامل ومتابعة تقدمك.
        </p>
        <div className="mt-comfortable flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.REGISTER}>
            <Button>إنشاء حساب</Button>
          </Link>
          <Link to={ROUTES.LOGIN}>
            <Button variant="outline">تسجيل الدخول</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
