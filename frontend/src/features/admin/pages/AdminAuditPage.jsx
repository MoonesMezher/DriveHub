import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader, Card, DataTable, SkeletonTable, Alert, Pagination, Select, Badge,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { fullName } from '@/lib/helpers/format'
import { getErrorMessage } from '@/lib/helpers/error'

export const AdminAuditPage = () => {
  const [limit, setLimit] = useState(50)
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit', limit],
    queryFn: async () => unwrap(await adminService.auditLogs({ limit })),
  })

  const logs = data?.logs ?? []
  const PAGE_SIZE = 25
  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE))
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns = [
    { key: 'at', label: 'التاريخ', className: 'whitespace-nowrap', render: (row) => formatDateTime(row.at) },
    {
      key: 'action',
      label: 'الإجراء',
      className: 'max-w-[180px]',
      render: (row) => (
        <Badge variant="primary" className="max-w-full truncate">
          {row.action}
        </Badge>
      ),
    },
    {
      key: 'actor',
      label: 'المستخدم',
      className: 'max-w-[160px] truncate',
      render: (row) => fullName(row.userId) || row.userId?.email || '—',
    },
    {
      key: 'target',
      label: 'الهدف',
      className: 'whitespace-nowrap',
      render: (row) => (row.entityType ? `${row.entityType}` : '—'),
    },
    {
      key: 'meta',
      label: 'تفاصيل',
      className: 'max-w-[280px]',
      render: (row) => (
        <span className="block truncate" title={
          row.metadata?.schoolName
          || row.metadata?.note
          || row.path
          || row.ip
          || ''
        }>
          {row.metadata?.schoolName
          || row.metadata?.note
          || row.path
          || row.ip
          || '—'}
        </span>
      ),
    },
  ]

  return (
    <div dir="rtl" className="min-w-0">
      <PageHeader
        variant="compact"
        title="سجل التدقيق"
        description="تتبع عمليات النظام والتغييرات الحساسة"
        actions={
          <Select
            wrapperClassName="w-36"
            value={String(limit)}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
            options={[
              { value: '25', label: '25 سجل' },
              { value: '50', label: '50 سجل' },
              { value: '100', label: '100 سجل' },
            ]}
          />
        }
      />

      <Card title={`آخر ${logs.length} عملية`} padding="none" className="min-w-0 overflow-hidden">
        {isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={8} cols={5} /></div>
        ) : error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(error)}</Alert>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedLogs}
              emptyLabel="لا توجد سجلات"
              className="max-w-full"
            />
            <div className="border-t border-outline-variant/50 p-comfortable">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
