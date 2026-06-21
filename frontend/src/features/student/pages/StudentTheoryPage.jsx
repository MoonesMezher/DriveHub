import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Badge, Tabs, Button, Icon } from '@/components/ui'
import { VideoEmbed, RichTextBody } from '@/components/ui/ContentMedia'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { SHARED_SECTION_LABELS } from '@/lib/constants/lessonLabels'

const TABS = [
  { id: 'theory', label: 'النظري' },
  { id: 'shared', label: 'مشترك' },
  { id: 'specific', label: 'مخصص' },
]

const CHAPTER_ICONS = ['menu_book', 'traffic', 'speed', 'warning', 'map', 'school', 'directions_car']

const fetchers = {
  theory: () => studentService.listTheory(),
  shared: () => studentService.listShared(),
  specific: () => studentService.listSpecific(),
}

const getChapterProgress = (phase, maxPhase, unlockMode, progressPercent) => {
  if (unlockMode === 'full') return 100
  const currentPhase = Math.max(1, Math.ceil((progressPercent / 100) * maxPhase))
  if (phase < currentPhase) return 100
  if (phase === currentPhase) return Math.min(100, Math.max(20, progressPercent % 100 || 40))
  return 0
}

export const StudentTheoryPage = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('theory')
  const [expandedPhase, setExpandedPhase] = useState(null)

  const unlockQuery = useQuery({
    queryKey: ['student', 'unlock'],
    queryFn: async () => unwrap(await studentService.getUnlock()),
  })

  const dashboardQuery = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const unlockMode = unlockQuery.data?.mode || 'progressive'
  const categoryCode = unlockQuery.data?.categoryCode
  const progressPercent = dashboardQuery.data?.dashboard?.statistics?.progressPercent ?? 0

  const setUnlockMutation = useMutation({
    mutationFn: (mode) => studentService.setUnlock({ mode, categoryCode }),
    onSuccess: () => {
      toast.success('تم تحديث وضع فتح المحتوى')
      queryClient.invalidateQueries({ queryKey: ['student', 'unlock'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'theory', activeTab],
    queryFn: async () => unwrap(await fetchers[activeTab]()),
  })

  const items = data?.items ?? []

  const chapters = useMemo(() => {
    const byPhase = {}
    items.forEach((item) => {
      const phase = item.phase ?? 0
      if (!byPhase[phase]) byPhase[phase] = []
      byPhase[phase].push(item)
    })
    return Object.entries(byPhase)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([phase, chapterItems]) => ({ phase: Number(phase), items: chapterItems }))
  }, [items])

  const maxPhase = useMemo(
    () => Math.max(...items.map((i) => i.phase ?? 0), 1),
    [items],
  )

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="التعلم النظري"
        description="محتوى نظري، مشترك، ومخصص حسب فئتك"
      />

      {categoryCode && (
        <Card className="mb-loose" title="وضع فتح المحتوى">
          <p className="mb-4 text-body-md text-on-surface-variant">
            اختر كيفية عرض المحتوى لفئة {categoryCode}: متدرج (مرحلة تلو الأخرى) أو كامل (كل المراحل متاحة).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={unlockMode === 'progressive' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUnlockMutation.mutate('progressive')}
              disabled={setUnlockMutation.isPending}
            >
              متدرج
            </Button>
            <Button
              variant={unlockMode === 'full' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setUnlockMutation.mutate('full')}
              disabled={setUnlockMutation.isPending}
            >
              كامل
            </Button>
            <Badge variant="secondary">الوضع الحالي: {unlockMode === 'full' ? 'كامل' : 'متدرج'}</Badge>
          </div>
        </Card>
      )}

      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} className="mb-loose" />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!items.length}
        emptyIcon="menu_book"
        emptyTitle="لا يوجد محتوى"
        emptyDescription="سيظهر المحتوى التعليمي هنا عند توفره"
      >
        {() => (
        <div className="space-y-comfortable">
          {chapters.map(({ phase, items: chapterItems }) => {
            const chapterProgress = getChapterProgress(phase, maxPhase, unlockMode, progressPercent)
            const isExpanded = expandedPhase === phase

            return (
              <Card key={phase}>
                <button
                  type="button"
                  className="flex w-full items-start gap-4 text-start"
                  onClick={() => setExpandedPhase(isExpanded ? null : phase)}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
                    <Icon name={CHAPTER_ICONS[phase % CHAPTER_ICONS.length]} size={26} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-headline-sm text-on-surface">
                        {phase === 0 ? 'مقدمة' : `الفصل ${phase}`}
                      </h3>
                      <Badge variant="secondary">{chapterItems.length} درس</Badge>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-label-sm text-on-surface-variant">
                        <span>التقدّم</span>
                        <span>{chapterProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full bg-secondary transition-all duration-500"
                          style={{ width: `${chapterProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Icon
                    name={isExpanded ? 'expand_less' : 'expand_more'}
                    size={24}
                    className="shrink-0 text-on-surface-variant"
                  />
                </button>

                {isExpanded && (
                  <div className="mt-loose space-y-comfortable border-t border-outline-variant/50 pt-loose">
                    {chapterItems.map((item) => (
                      <div key={item._id} className="rounded-xl bg-surface-container-low p-comfortable">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-headline-sm text-on-surface">{item.title}</h4>
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="mt-3 w-full max-w-lg rounded-lg object-cover max-h-48"
                                loading="lazy"
                              />
                            )}
                            <RichTextBody content={item.body} className="mt-2 text-on-surface-variant" />
                            {item.videoUrl && (
                              <div className="mt-4 max-w-lg">
                                <VideoEmbed url={item.videoUrl} title={item.title} />
                              </div>
                            )}
                            {item.mediaUrl && (
                              <img
                                src={item.mediaUrl}
                                alt={item.title}
                                className="mt-3 w-full max-w-lg rounded-lg object-cover max-h-48"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.section && (
                              <Badge variant="primary">
                                {SHARED_SECTION_LABELS[item.section] ?? item.section}
                              </Badge>
                            )}
                            {item.categoryCode && (
                              <Badge variant="default">فئة {item.categoryCode}</Badge>
                            )}
                            {item.interactiveQuestions?.length > 0 && (
                              <Badge variant="success">
                                {item.interactiveQuestions.length} سؤال
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
