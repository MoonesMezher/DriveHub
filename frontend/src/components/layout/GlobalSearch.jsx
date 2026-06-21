import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SearchInput } from '@/components/ui/SearchInput'
import { Icon } from '@/components/ui/Icon'
import { searchService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { searchLocalPages } from '@/lib/helpers/searchIndex'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { SEARCH_TYPE_LABELS } from '@/lib/constants/searchLabels'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'

const mergeResults = (localResults, remoteResults) => {
  const seen = new Set()
  const merged = []

  for (const item of [...localResults, ...remoteResults]) {
    const key = `${item.href}:${item.title}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
    if (merged.length >= 24) break
  }

  return merged
}

export const GlobalSearch = ({ className = '' }) => {
  const { activeRole } = useAuth()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 0 })
  const debouncedQuery = useDebouncedValue(query, 280)

  const trimmedQuery = debouncedQuery.trim()
  const canSearch = trimmedQuery.length >= 2

  const localResults = useMemo(
    () => (canSearch ? searchLocalPages(activeRole, trimmedQuery) : []),
    [activeRole, trimmedQuery, canSearch],
  )

  const searchQuery = useQuery({
    queryKey: ['global-search', activeRole, trimmedQuery],
    queryFn: () => searchService.global(trimmedQuery).then(unwrap),
    enabled: canSearch,
    staleTime: 30_000,
    retry: 1,
  })

  const remoteResults = searchQuery.data?.results ?? []
  const results = useMemo(
    () => mergeResults(localResults, remoteResults),
    [localResults, remoteResults],
  )

  const showPanel = open && canSearch

  const updatePanelPosition = () => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPanelStyle({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    setActiveIndex(-1)
  }, [trimmedQuery, results.length])

  useEffect(() => {
    if (!showPanel) return undefined
    updatePanelPosition()
    const onScrollOrResize = () => updatePanelPosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [showPanel, query])

  useEffect(() => {
    const handleShortcut = (event) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const modifier = isMac ? event.metaKey : event.ctrlKey
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target
      if (
        containerRef.current?.contains(target)
        || panelRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const goToResult = (href) => {
    setOpen(false)
    setQuery('')
    navigate(href)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && canSearch) {
      event.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        goToResult(results[activeIndex].href)
      } else if (results[0]) {
        goToResult(results[0].href)
      } else {
        setOpen(true)
      }
      return
    }

    if (!showPanel) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const panel = showPanel
    ? createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: panelStyle.top,
            left: panelStyle.left,
            width: panelStyle.width,
            zIndex: 200,
          }}
          className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-elevated"
          role="listbox"
        >
          {searchQuery.isLoading && remoteResults.length === 0 && localResults.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-body-md text-on-surface-variant">
              <Icon name="sync" size={18} className="animate-spin" />
              جاري البحث...
            </div>
          )}

          {searchQuery.isError && (
            <div className="border-b border-outline-variant/50 px-4 py-2 text-label-sm text-error">
              تعذّر تحميل بيانات البحث — تُعرض الصفحات المتاحة فقط
            </div>
          )}

          {!searchQuery.isLoading && results.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-4 text-body-md text-on-surface-variant">
              <Icon name="search_off" size={20} />
              لا توجد نتائج لـ «{trimmedQuery}»
            </div>
          )}

          {results.length > 0 && (
            <ul className="max-h-[min(360px,50vh)] overflow-y-auto py-1 custom-scrollbar">
              {results.map((item, index) => (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    to={item.href}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => {
                      setOpen(false)
                      setQuery('')
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      index === activeIndex
                        ? 'bg-primary-container/25'
                        : 'hover:bg-surface-container-low',
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                      <Icon name={item.icon || 'search'} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-label-md font-medium text-on-surface">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="mt-0.5 block truncate text-label-sm text-on-surface-variant">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                      {SEARCH_TYPE_LABELS[item.type] || item.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-outline-variant/50 bg-surface-container/40 px-4 py-2 text-label-sm text-on-surface-variant">
            {results.length > 0 ? `${results.length} نتيجة` : 'اكتب كلمتين على الأقل'} · Enter للانتقال
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <div ref={containerRef} className={cn('relative w-full', className)}>
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onClear={() => setOpen(false)}
          placeholder={`بحث في ${ROLE_LABELS[activeRole] || 'المنصة'}...`}
          aria-label="بحث عام"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          role="combobox"
        />
      </div>
      {panel}
    </>
  )
}
