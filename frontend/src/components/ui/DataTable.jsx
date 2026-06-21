import { cn } from '@/lib/cn'
import { Card } from './Card'
import { EmptyState } from './EmptyState'

export const DataTable = ({
  columns,
  rows,
  emptyLabel,
  emptyPreset = 'no-data',
  className = '',
  mobileCardRender,
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

  return (
    <>
      <div className={cn('hidden overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card md:block', className)}>
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
                key={row.id ?? idx}
                className="border-b border-outline-variant/60 transition-colors last:border-0 hover:bg-surface-container-low"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-comfortable py-3 text-on-surface">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-comfortable md:hidden">
        {rows.map((row, idx) => (
          mobileCardRender ? (
            mobileCardRender(row, idx)
          ) : (
            <Card key={row.id ?? idx} padding="md">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-4 border-b border-outline-variant/40 py-2 last:border-0">
                  <span className="text-label-sm text-on-surface-variant">{col.label}</span>
                  <span className="text-body-md text-on-surface">
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
