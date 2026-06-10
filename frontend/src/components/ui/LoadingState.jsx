import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const LoadingState = ({ label = 'جاري التحميل...', className = '' }) => (
  <div className={cn('flex flex-col items-center justify-center py-loose text-on-surface-variant', className)}>
    <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
    <p className="mt-3 text-body-md">{label}</p>
  </div>
)
