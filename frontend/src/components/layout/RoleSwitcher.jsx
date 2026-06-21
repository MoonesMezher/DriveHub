import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { buildContextOptions } from '@/lib/auth/authUtils'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

export const RoleSwitcher = ({ className = '' }) => {
  const { user, activeRole, switchContext, getHomeRoute } = useAuth()
  const [loading, setLoading] = useState(false)
  const options = buildContextOptions(user)

  if (options.length <= 1) return null

  const handleSwitch = async (opt) => {
    if (opt.role === activeRole) return
    setLoading(true)
    try {
      await switchContext({ role: opt.role, schoolId: opt.schoolId })
      window.location.href = getHomeRoute()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('rounded-xl border border-outline-variant bg-surface-container-lowest p-3', className)}>
      <p className="mb-2 text-label-sm text-on-surface-variant">تبديل السياق</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            disabled={loading}
            onClick={() => handleSwitch(opt)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-label-sm transition-all',
              opt.role === activeRole
                ? 'bg-primary !text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
            )}
          >
            <Icon name="swap_horiz" size={16} className="me-1 align-middle" />
            {ROLE_LABELS[opt.role] || opt.role}
          </button>
        ))}
      </div>
    </div>
  )
}
