import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Icon,
  AsyncContent,
  PageSection,
  SectionBlock,
  Alert,
} from '@/components/ui'
import { VideoEmbed, RichTextBody } from '@/components/ui/ContentMedia'
import { CtaBanner } from '@/components/sections'
import { contentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { ROUTES } from '@/lib/constants/routes'
import { useAuthContext } from '@/app/providers/AuthProvider'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'

export const SamplePage = () => {
  const { isAuthenticated } = useAuthContext()
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const sampleQuery = useQuery({
    queryKey: ['content', 'sample', isAuthenticated],
    queryFn: async () => unwrap(await contentService.getSample({ category: 'B' })),
  })

  const articles = sampleQuery.data?.articles ?? []
  const videos = sampleQuery.data?.videos ?? []
  const questions = sampleQuery.data?.questions ?? []

  const pick = (qId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [qId]: optionKey }))
    setRevealed((prev) => ({ ...prev, [qId]: true }))
  }

  const score = questions.filter(
    (q) => answers[q._id] === q.correctAnswer,
  ).length

  const allAnswered = Object.keys(revealed).length === questions.length && questions.length > 0

  return (
    <div dir="rtl" className="space-y-loose">
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={PUBLIC_HERO_IMAGES.sample}
          alt="عينة مجانية"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white backdrop-blur">
            {sampleQuery.data?.tier === 'full' ? 'عينة كاملة' : 'معاينة مجانية'}
          </Badge>
          <PageHeader
            title="عينة مجانية — نظري"
            description={
              isAuthenticated
                ? 'مقالات نظرية، فيديوهات، صور، وأسئلة تفاعلية — عينة كاملة للمسجّلين'
                : 'مقالات وشرح نظري مع فيديو وصور — جرّب 3 أسئلة قبل التسجيل الكامل'
            }
            actions={
              !isAuthenticated && (
                <Link to={ROUTES.REGISTER}>
                  <Button variant="secondary">التسجيل للوصول الكامل</Button>
                </Link>
              )
            }
            className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
          />
          {allAnswered && (
            <Alert variant="success" title={`نتيجتك: ${score} / ${questions.length}`} className="mt-6 max-w-md">
              {score === questions.length
                ? 'ممتاز! سجّل للوصول إلى المحتوى الكامل.'
                : 'جرّب مرة أخرى أو سجّل للمزيد من الأسئلة.'}
            </Alert>
          )}
        </div>
      </section>

      <AsyncContent
        isLoading={sampleQuery.isLoading}
        error={sampleQuery.error}
        isEmpty={!articles.length && !questions.length}
        emptyIcon="quiz"
        emptyTitle="لا توجد عينة متاحة"
        emptyDescription="شغّل seed:dev في الخادم لتحميل المحتوى التجريبي."
      >
        {() => (
          <div className="space-y-loose">
            {articles.length > 0 && (
              <PageSection variant="contained">
                <SectionBlock title="مقالات نظرية" description="شرح مبسّط مع صور وفيديو">
                  <div className="space-y-comfortable">
                    {articles.map((article) => (
                      <Card key={article._id} title={article.title}>
                        {article.imageUrl && (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="mb-4 max-h-64 w-full rounded-xl object-cover"
                            loading="lazy"
                          />
                        )}
                        <RichTextBody content={article.body} className="text-on-surface-variant" />
                        {article.videoUrl && (
                          <div className="mt-4">
                            <VideoEmbed url={article.videoUrl} title={article.title} />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </SectionBlock>
              </PageSection>
            )}

            {videos.length > 0 && (
              <PageSection>
                <SectionBlock title="فيديوهات تعليمية" description="شروحات مرئية مختصرة">
                  <div className="grid gap-comfortable md:grid-cols-2">
                    {videos.map((video) => (
                      <Card key={video._id} title={video.title}>
                        {video.thumbnailUrl && !video.url?.includes('embed') && (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="mb-3 max-h-40 w-full rounded-lg object-cover"
                            loading="lazy"
                          />
                        )}
                        <VideoEmbed url={video.url} title={video.title} />
                        {video.durationSeconds && (
                          <p className="mt-2 text-label-sm text-on-surface-variant">
                            المدة: {Math.floor(video.durationSeconds / 60)} دقيقة
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </SectionBlock>
              </PageSection>
            )}

            {questions.length > 0 && (
              <PageSection variant="elevated">
                <SectionBlock title="أسئلة تفاعلية" description="اختر إجابة لكل سؤال وشاهد التفسير">
                  <div className="space-y-comfortable">
                    {questions.map((q, index) => {
                      const chosen = answers[q._id]
                      const show = revealed[q._id]
                      return (
                        <Card key={q._id} title={`سؤال ${index + 1}`}>
                          {q.imageUrl && (
                            <img
                              src={q.imageUrl}
                              alt=""
                              className="mb-4 max-h-48 w-full max-w-md rounded-lg object-cover"
                              loading="lazy"
                            />
                          )}
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
                </SectionBlock>
              </PageSection>
            )}
          </div>
        )}
      </AsyncContent>

      <CtaBanner
        title="هل أعجبتك العينة؟"
        description="سجّل حساباً مجانياً للوصول إلى المحتوى الكامل ومتابعة تقدمك"
        primaryAction={{ label: 'إنشاء حساب', to: ROUTES.REGISTER }}
        secondaryAction={{ label: 'تسجيل الدخول', to: ROUTES.LOGIN }}
      />
    </div>
  )
}
