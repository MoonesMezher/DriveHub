import { cn } from '@/lib/cn'

export const Tabs = ({ tabs, activeId, onChange, className = '' }) => (
  <div className={cn('flex border-b border-outline-variant', className)} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeId === tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex-1 py-comfortable text-label-md transition-all',
          activeId === tab.id
            ? 'login-tab-active'
            : 'text-on-surface-variant hover:text-primary',
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
)
