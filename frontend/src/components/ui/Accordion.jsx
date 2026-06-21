import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const Accordion = ({ items, className = '' }) => {
  const [openId, setOpenId] = useState(null)

  return (
    <div className={cn('divide-y divide-outline-variant border-y border-outline-variant', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        const panelId = `accordion-panel-${item.id}`
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between py-comfortable text-start transition-colors hover:text-primary"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="text-label-md font-medium text-on-surface">{item.title}</span>
              <Icon
                name="expand_more"
                className={cn('text-on-surface-variant transition-transform', isOpen && 'rotate-180')}
              />
            </button>
            {isOpen && (
              <div id={panelId} className="pb-comfortable text-body-md text-on-surface-variant">{item.content}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
