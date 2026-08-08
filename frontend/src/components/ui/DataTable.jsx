import { cn } from '@/lib/cn'
import { Card } from './Card'
import { EmptyState } from './EmptyState'

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [role="menuitem"]'

const isNestedInteractiveTarget = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return false
  const interactive = target.closest(INTERACTIVE_SELECTOR)
  return Boolean(interactive && interactive !== event.currentTarget)
}

export const DataTable = ({
  columns,
  rows,
  emptyLabel,
  emptyPreset = 'no-data',
  className = '',
  mobileCardRender,
  onRowClick,
  rowClassName,
}) => {
  if (!rows?.length) {
    return (
      <div className={cn('rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card', className)}>
        <EmptyState
          preset={emptyPreset}
          title={emptyLabel}
          variant="table"
          size="sm"
        />
      </div>
    )
  }

  const handleRowActivate = (row) => (event) => {
    if (!onRowClick || isNestedInteractiveTarget(event)) return
    onRowClick(row)
  }

  return (
    <>
      <div className={cn('hidden min-w-0 max-w-full overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card md:block', className)}>
        <table className="w-full min-w-[640px] border-collapse text-body-md">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container text-label-sm text-on-surface-variant">
              {columns.map((col) => (
                <th key={col.key} className="px-comfortable py-3 text-start font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id ?? row._id ?? idx}
                onClick={onRowClick ? handleRowActivate(row) : undefined}
                className={cn(
                  'border-b border-outline-variant/60 transition-colors last:border-0 hover:bg-surface-container-low',
                  onRowClick && 'cursor-pointer',
                  typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-comfortable py-3 text-on-surface', col.className)}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="min-w-0 max-w-full space-y-comfortable md:hidden">
        {rows.map((row, idx) => (
          mobileCardRender ? (
            mobileCardRender(row, idx)
          ) : (
            <Card
              key={row.id ?? row._id ?? idx}
              padding="md"
              className={cn(
                'min-w-0 max-w-full overflow-hidden',
                onRowClick && 'cursor-pointer',
                typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
              )}
              onClick={onRowClick ? handleRowActivate(row) : undefined}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex min-w-0 items-start justify-between gap-4 border-b border-outline-variant/40 py-2 last:border-0">
                  <span className="shrink-0 text-label-sm text-on-surface-variant">{col.label}</span>
                  <span className="min-w-0 max-w-[65%] break-words text-end text-body-md text-on-surface">
                    {col.render ? col.render(row) : row[col.key]}
                  </span>
                </div>
              ))}
            </Card>
          )
        ))}
      </div>
    </>
  )
}
