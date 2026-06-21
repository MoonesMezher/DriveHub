import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, Icon } from '@/components/ui'
import { VideoEmbed } from '@/components/ui/ContentMedia'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'

const formatDuration = (seconds) => {
  if (!seconds) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins} د`
}

const isVideoWatched = (video, progressPercent, maxPhase) => {
  if (maxPhase <= 0) return false
  const watchedThroughPhase = Math.ceil((progressPercent / 100) * maxPhase)
  return (video.phase ?? 0) < watchedThroughPhase
}

export const StudentVideosPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'videos'],
    queryFn: async () => unwrap(await studentService.listVideos()),
  })

  const dashboardQuery = useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: async () => unwrap(await studentService.dashboard()),
  })

  const items = data?.items ?? []
  const progressPercent = dashboardQuery.data?.dashboard?.statistics?.progressPercent ?? 0

  const maxPhase = useMemo(
    () => Math.max(...items.map((v) => v.phase ?? 0), 0),
    [items],
  )

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="فيديوهات عملية"
        description="شاهد دروس القيادة العملية المرئية"
      />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!items.length}
        emptyIcon="play_circle"
        emptyTitle="لا توجد فيديوهات"
        emptyDescription="ستظهر الفيديوهات التدريبية هنا عند توفرها"
      >
        {() => (
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3">
          {items.map((video) => {
            const watched = isVideoWatched(video, progressPercent, maxPhase)

            return (
              <Card key={video._id} hoverable padding="none" className="overflow-hidden">
                <div className="relative">
                  {video.url ? (
                    <VideoEmbed url={video.url} title={video.title} className="rounded-none" />
                  ) : video.thumbnailUrl ? (
                    <div className="relative aspect-video bg-surface-container">
                      <img
                        src={video.thumbnailUrl}
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
                  {watched && (
                    <Badge variant="success" className="absolute start-3 top-3">
                      <Icon name="check_circle" size={14} className="me-1" />
                      مشاهد
                    </Badge>
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
            )
          })}
        </div>
        )}
      </AsyncContent>
    </div>
  )
}
