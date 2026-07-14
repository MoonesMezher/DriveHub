import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, Icon } from '@/components/ui'
import { VideoEmbed } from '@/components/ui/ContentMedia'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

const formatDuration = (seconds) => {
  if (!seconds) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins} د`
}

export const StudentVideosPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'videos'],
    queryFn: async () => unwrap(await studentService.listVideos()),
  })

  const unlockQuery = useQuery({
    queryKey: ['student', 'unlock'],
    queryFn: async () => unwrap(await studentService.getUnlock()),
  })

  const items = data?.items ?? []
  const unlockMode = unlockQuery.data?.mode || 'progressive'
  const maxUnlockedPhase = unlockQuery.data?.maxUnlockedPhase ?? 1
  const totalPhases = unlockQuery.data?.totalPhases ?? maxUnlockedPhase
  const lockedPhaseCount = unlockMode === 'progressive' && totalPhases > maxUnlockedPhase
    ? totalPhases - maxUnlockedPhase
    : 0

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="فيديوهات عملية"
        description="شاهد دروس القيادة العملية المرئية"
      />

      {unlockMode === 'progressive' && totalPhases > 0 && (
        <p className="mb-loose text-body-md text-on-surface-variant">
          الفيديوهات المتاحة حسب تقدّمك النظري — مفتوح حتى المرحلة {maxUnlockedPhase} من {totalPhases}
        </p>
      )}

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!items.length && !lockedPhaseCount}
        emptyIcon="play_circle"
        emptyTitle="لا توجد فيديوهات"
        emptyDescription="ستظهر الفيديوهات التدريبية هنا عند توفرها"
      >
        {() => (
        <div className="space-y-comfortable">
          <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
            {items.map((video) => (
              <Card key={video._id} hoverable padding="none" className="overflow-hidden">
                <div className="relative">
                  {video.url ? (
                    <VideoEmbed url={video.url} title={video.title} className="rounded-none" />
                  ) : video.thumbnailUrl ? (
                    <div className="relative aspect-video bg-surface-container">
                      <img
                        src={resolveMediaUrl(video.thumbnailUrl)}
                        alt={video.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Icon name="play_circle" size={48} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-surface-container">
                      <Icon name="videocam" size={40} className="text-on-surface-variant" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-comfortable">
                  <h3 className="text-headline-sm text-on-surface">{video.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.phase != null && (
                      <Badge variant="secondary">المرحلة {video.phase}</Badge>
                    )}
                    <Badge variant="default">{formatDuration(video.durationSeconds)}</Badge>
                    {video.categoryCode && (
                      <Badge variant="primary">فئة {video.categoryCode}</Badge>
                    )}
                  </div>
                  {video.url && !video.url.includes('youtube') && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-label-md text-primary hover:underline"
                    >
                      <Icon name="open_in_new" size={16} />
                      مشاهدة الفيديو
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {lockedPhaseCount > 0 && (
            <Card className="border-dashed border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Icon name="lock" size={24} />
                <p className="text-body-md">
                  فيديوهات المراحل التالية مقفلة — أكمل الفصل النظري الحالي لفتحها
                </p>
              </div>
            </Card>
          )}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
