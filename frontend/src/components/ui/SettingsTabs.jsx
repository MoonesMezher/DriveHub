import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const SettingsTabs = ({ tabs, active, onChange, variant = 'default' }) => (
  <nav className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-2">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-label-md transition-all',
          active === tab.id
            ? variant === 'ultra' ? 'settings-tab-active-ultra' : 'settings-tab-active'
            : 'text-on-surface-variant hover:bg-surface-container-low',
        )}
      >
        <Icon name={tab.icon} size={20} />
        {tab.label}
      </button>
    ))}
  </nav>
)
