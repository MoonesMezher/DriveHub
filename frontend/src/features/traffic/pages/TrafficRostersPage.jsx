import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader, Card, DataTable, Pagination, SkeletonTable, Alert,
  SearchInput, StatusBadge,
} from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { rosterVerifyUrl, rosterQrImageUrl } from '@/lib/helpers/roster'

const PAGE_SIZE = 10

const rosterStatusLabels = {
  draft: 'مسودة',
  submitted: 'مُرسَل',
  distributed: 'موزّع',
}

const rosterStatusVariants = {
  draft: 'default',
  submitted: 'warning',
  distributed: 'success',
}

export const TrafficRostersPage = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const rostersQuery = useQuery({
    queryKey: ['traffic', 'rosters'],
    queryFn: () => trafficService.listRosters().then(unwrap),
  })

  const rosters = rostersQuery.data?.rosters ?? []

  const filteredRosters = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rosters
    return rosters.filter(
      (r) =>
        r.schoolId?.name?.toLowerCase().includes(q)
        || r.courseId?.categoryCode?.toLowerCase().includes(q)
        || r.trafficBatchId?.toLowerCase().includes(q),
    )
  }, [rosters, search])

  const totalPages = Math.max(1, Math.ceil(filteredRosters.length / PAGE_SIZE))
  const paginatedRosters = filteredRosters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns = [
    {
      key: 'school',
      label: 'المدرسة',
      render: (roster) => roster.schoolId?.name || '—',
    },
    {
      key: 'category',
      label: 'الفئة',
      render: (roster) =>
        `${roster.courseId?.categoryCode || '—'}${roster.courseId?.subTypeCode ? ` (${roster.courseId.subTypeCode})` : ''}`,
    },
    {
      key: 'count',
      label: 'عدد الطلاب',
      render: (roster) => roster.studentIds?.length ?? 0,
    },
    {
      key: 'batch',
      label: 'دفعة المرور',
      render: (roster) => roster.trafficBatchId || '—',
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (roster) => (
        <StatusBadge
          status={roster.status}
          labels={rosterStatusLabels}
          variants={rosterStatusVariants}
        />
      ),
    },
    {
      key: 'submittedAt',
      label: 'تاريخ الإرسال',
      render: (roster) => formatDate(roster.submittedAt),
    },
    {
      key: 'verify',
      label: 'التحقق',
      render: (roster) =>
        roster.verificationToken ? (
          <div className="space-y-1">
            <img
              src={rosterQrImageUrl(roster.verificationToken, 80)}
              alt="QR"
              className="rounded border border-outline-variant/50 bg-white p-1"
            />
            <p className="max-w-[10rem] truncate font-mono text-label-sm" title={roster.verificationToken}>
              {roster.qrCode || roster.verificationToken.slice(0, 16)}
            </p>
            <a
              href={rosterVerifyUrl(roster.verificationToken)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              تحقق
            </a>
          </div>
        ) : '—',
    },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="قوائم الطلاب"
        description="القوائم الموزّعة من المدارس للامتحان"
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالمدرسة أو الفئة..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <Card padding="none">
        {rostersQuery.isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={6} cols={7} /></div>
        ) : rostersQuery.error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(rostersQuery.error)}</Alert>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedRosters}
              emptyLabel="لا توجد قوائم موزّعة"
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
