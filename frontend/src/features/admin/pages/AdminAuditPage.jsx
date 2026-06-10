import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, DataTable, Badge } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'

export const AdminAuditPage = () => {
  const [limit, setLimit] = useState(50)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'audit', limit],
    queryFn: async () => unwrap(await adminService.auditLogs({ limit })),
  })

  const logs = data?.logs ?? []

  const columns = [
    { key: 'at', label: 'التاريخ', render: (row) => formatDateTime(row.at) },
    { key: 'action', label: 'الإجراء', render: (row) => (
      <Badge variant="primary">{row.action}</Badge>
    ) },
    { key: 'actor', label: 'المستخدم', render: (row) => row.userId?.name || row.actorId || '—' },
    { key: 'target', label: 'الهدف', render: (row) => row.targetType ? `${row.targetType}` : '—' },
    { key: 'meta', label: 'تفاصيل', render: (row) => row.meta?.schoolId || row.ip || '—' },
  ]

  return (
    <div dir="rtl">
      <PageHeader
        title="سجل التدقيق"
        description="تتبع عمليات النظام والتغييرات الحساسة — شاشة 24 من مركز التصميم"
        actions={
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md"
          >
            <option value={25}>25 سجل</option>
            <option value={50}>50 سجل</option>
            <option value={100}>100 سجل</option>
          </select>
        }
      />

      <AsyncContent isLoading={isLoading} error={error}>
        {() => (
<Card title={`آخر ${logs.length} عملية`} padding="none">
          <DataTable columns={columns} rows={logs} />
        </Card>

        )}
      </AsyncContent>
    </div>
  )
}
