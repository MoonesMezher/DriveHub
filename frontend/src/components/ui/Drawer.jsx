import { useEffect } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const Drawer = ({
  open,
  onClose,
  children,
  title,
  side = 'end',
  className = '',
}) => {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90]" dir="rtl">
      <div className="drawer-overlay absolute inset-0" onClick={onClose} aria-hidden="true" />
      <aside
        className={cn(
          'drawer-panel absolute top-0 flex h-full w-72 max-w-[85vw] flex-col',
          side === 'end' ? 'end-0' : 'start-0',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-outline-variant px-comfortable py-4">
            <h2 className="text-headline-sm text-primary">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
              aria-label="إغلاق"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
      </aside>
    </div>
  )
}
