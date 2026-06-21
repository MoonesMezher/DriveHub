import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

export const Dialog = ({
  open,
  onClose,
  children,
  className = '',
  size = 'md',
}) => {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div
      className="drawer-overlay fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-loose shadow-elevated outline-none',
          sizes[size],
          className,
        )}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
