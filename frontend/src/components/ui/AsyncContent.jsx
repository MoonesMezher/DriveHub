import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import { Card } from './Card'
import { getErrorMessage } from '@/lib/helpers/error'

/**
 * يعرض حالات التحميل / الخطأ / الفراغ قبل المحتوى.
 * عند الوصول لبيانات غير مضمونة، مرّر الأبناء كدالة لتأجيل التقييم:
 *   <AsyncContent data={user}>{(user) => <div>{user.name}</div>}</AsyncContent>
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
  children,
  render,
}) => {
  if (isLoading) return <LoadingState />
  if (error) {
    return (
      <Card variant="tinted" className="!bg-error-container !text-on-error-container">
        <p className="text-body-md">{getErrorMessage(error)}</p>
      </Card>
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
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyAction?.label}
          onAction={emptyAction?.onClick}
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
