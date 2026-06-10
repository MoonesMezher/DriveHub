import { cn } from '@/lib/cn'

export const DataTable = ({ columns, rows, emptyLabel = 'لا توجد بيانات', className = '' }) => (
  <div className={cn('overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card', className)}>
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
        {!rows?.length ? (
          <tr>
            <td colSpan={columns.length} className="px-comfortable py-loose text-center text-on-surface-variant">
              {emptyLabel}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
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
          ))
        )}
      </tbody>
    </table>
  </div>
)
