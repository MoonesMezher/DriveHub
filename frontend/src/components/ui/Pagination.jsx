import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Icon } from './Icon'

export const Pagination = ({
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i += 1) pages.push(i)

  return (
    <nav
      aria-label="التصفح"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="الصفحة السابقة"
      >
        <Icon name="chevron_right" size={20} />
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange?.(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="الصفحة التالية"
      >
        <Icon name="chevron_left" size={20} />
      </Button>
    </nav>
  )
}
