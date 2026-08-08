import { useState } from 'react'
import { cn } from '@/lib/cn'
import { linkifyText } from '@/lib/helpers/linkify'
import { Icon } from './Icon'

export const Accordion = ({ items, className = '' }) => {
  const [openId, setOpenId] = useState(null)

  return (
    <div className={cn('divide-y divide-outline-variant border-y border-outline-variant', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        const panelId = `accordion-panel-${item.id}`
        const linkUrl = typeof item.linkUrl === 'string' ? item.linkUrl.trim() : ''
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
              <div id={panelId} className="space-y-2 pb-comfortable text-body-md text-on-surface-variant">
                {typeof item.content === 'string' ? (
                  <div className="whitespace-pre-wrap">{linkifyText(item.content)}</div>
                ) : (
                  item.content
                )}
                {linkUrl && (
                  <a
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-primary underline underline-offset-2"
                  >
                    {(item.linkLabel && String(item.linkLabel).trim()) || linkUrl}
                  </a>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
