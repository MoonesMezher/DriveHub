import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Button } from './Button'

const PRESETS = {
  'no-data': { icon: 'inbox', title: 'لا توجد بيانات', description: 'لم يتم العثور على أي عناصر بعد.' },
  'no-results': { icon: 'search_off', title: 'لا توجد نتائج', description: 'جرّب تغيير معايير البحث أو الفلترة.' },
  error: { icon: 'error_outline', title: 'حدث خطأ', description: 'تعذّر تحميل البيانات. حاول مرة أخرى.' },
  offline: { icon: 'cloud_off', title: 'لا يوجد اتصال', description: 'تحقق من اتصالك بالإنترنت.' },
  unauthorized: { icon: 'lock', title: 'غير مصرّح', description: 'ليس لديك صلاحية للوصول إلى هذه الصفحة.' },
}

const variantStyles = {
  page: 'py-loose',
  card: 'py-comfortable',
  table: 'py-comfortable',
  search: 'py-comfortable',
}

const sizeStyles = {
  sm: { iconBox: 'h-12 w-12', icon: 24 },
  md: { iconBox: 'h-16 w-16', icon: 32 },
}

export const EmptyState = ({
  preset,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'page',
  size = 'md',
  className = '',
}) => {
  const presetData = preset ? PRESETS[preset] : {}
  const resolvedIcon = icon || presetData.icon || 'inbox'
  const resolvedTitle = title || presetData.title
  const resolvedDescription = description || presetData.description
  const styles = sizeStyles[size]

  return (
    <div className={cn('flex flex-col items-center text-center', variantStyles[variant], className)}>
      <div className={cn('mb-comfortable flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant', styles.iconBox)}>
        <Icon name={resolvedIcon} size={styles.icon} />
      </div>
      {resolvedTitle && <h3 className="text-headline-sm text-on-surface">{resolvedTitle}</h3>}
      {resolvedDescription && (
        <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">{resolvedDescription}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-comfortable" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
