import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'

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

  const items = data?.items ?? []

  return (
    <div dir="rtl">
      <PageHeader
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
          {items.map((video) => (
            <Card key={video._id} hoverable>
              <div className="space-y-3">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-surface-container">
                  <span className="text-label-lg text-primary">▶</span>
                </div>
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
                {video.url && (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-label-md text-primary hover:underline"
                  >
                    مشاهدة الفيديو
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
