import { cn } from '@/lib/cn'

export const Skeleton = ({ className = '' }) => (
  <div className={cn('animate-pulse rounded-lg bg-surface-container', className)} />
)

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className = '' }) => (
  <div className={cn('rounded-xl border border-outline-variant p-comfortable', className)}>
    <Skeleton className="mb-4 h-6 w-1/3" />
    <SkeletonText lines={2} />
  </div>
)

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={cn('overflow-hidden rounded-xl border border-outline-variant', className)}>
    <div className="border-b border-outline-variant bg-surface-container p-comfortable">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="flex gap-4 border-b border-outline-variant/60 p-comfortable last:border-0">
        {Array.from({ length: cols }).map((_, col) => (
          <Skeleton key={col} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)
