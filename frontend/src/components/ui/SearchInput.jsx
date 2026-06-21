import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

export const SearchInput = forwardRef(function SearchInput(
  {
    className = '',
    inputClassName = '',
    placeholder = 'بحث...',
    value = '',
    onChange,
    onFocus,
    onKeyDown,
    onClear,
    ...props
  },
  ref,
) {
  const handleClear = () => {
    onChange?.({ target: { value: '' } })
    onClear?.()
  }

  return (
    <div
      className={cn(
        'group relative w-full rounded-2xl bg-gradient-to-l from-surface-container-low/80 to-surface-container-lowest p-[1px]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
        className,
      )}
    >
      <div className="relative flex items-center rounded-[15px] bg-surface-container-lowest/95">
        <Icon
          name="search"
          className="pointer-events-none absolute start-3.5 text-on-surface-variant/75 transition-colors group-focus-within:text-primary"
          size={20}
        />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-[15px] border-0 bg-transparent py-2.5 ps-11 pe-10',
            'text-body-md text-on-surface placeholder:text-on-surface-variant/55',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/12',
            inputClassName,
          )}
          {...props}
        />
        {value ? (
          <button
            type="button"
            aria-label="مسح البحث"
            onClick={handleClear}
            className="absolute end-2 flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-primary/8 hover:text-primary"
          >
            <Icon name="close" size={16} />
          </button>
        ) : (
          <span className="pointer-events-none absolute end-3 hidden rounded-md border border-outline-variant/50 bg-surface-container px-1.5 py-0.5 text-[10px] font-medium text-on-surface-variant/80 sm:inline">
            ⌘K
          </span>
        )}
      </div>
    </div>
  )
})
