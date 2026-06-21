import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import { Card } from './Card'
import { Alert } from './Alert'
import { SkeletonCard } from './Skeleton'
import { getErrorMessage } from '@/lib/helpers/error'

/**
 * يعرض حالات التحميل / الخطأ / الفراغ قبل المحتوى.
 */
export const AsyncContent = ({
  isLoading,
  error,
  isEmpty,
  data,
  emptyIcon,
  emptyTitle = 'لا توجد بيانات',
  emptyDescription,
  emptyAction,
  emptyPreset = 'no-data',
  skeleton = false,
  children,
  render,
}) => {
  if (isLoading) {
    if (skeleton) return <SkeletonCard />
    return <LoadingState />
  }
  if (error) {
    return (
      <Alert variant="error" title="حدث خطأ">
        {getErrorMessage(error)}
      </Alert>
    )
  }

  const showEmpty =
    isEmpty !== undefined
      ? isEmpty
      : data !== undefined
        ? data === null || data === undefined
        : false
  if (showEmpty) {
    return (
      <Card>
        <EmptyState
          preset={emptyPreset}
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyAction?.label}
          onAction={emptyAction?.onClick}
          variant="card"
        />
      </Card>
    )
  }

  const content = render ?? children
  if (typeof content === 'function') {
    if (data !== undefined && (data === null || data === undefined)) return null
    return content(data)
  }

  if (import.meta.env.DEV) {
    console.warn(
      '[AsyncContent] مرّر المحتوى كدالة {() => ...} أو عبر render لتجنّب قراءة بيانات غير محمّلة.',
    )
  }
  return content
}
