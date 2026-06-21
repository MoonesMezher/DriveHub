import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  PageHeader, Card, DataTable, Pagination, SkeletonTable, Alert,
  SearchInput, Select, Badge, StatusBadge,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { LESSON_STATUS_LABELS } from '@/lib/constants/lessonLabels'

const PAGE_SIZE = 10

const weekBounds = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = (day + 1) % 7
  start.setDate(start.getDate() - diff)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { from: start.toISOString(), to: end.toISOString() }
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  ...Object.entries(LESSON_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export const ManagerSchedulePage = () => {
  const bounds = useMemo(() => weekBounds(), [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const scheduleQuery = useQuery({
    queryKey: ['manager', 'schedule', bounds.from],
    queryFn: async () => unwrap(await managerService.getSchedule(bounds)),
  })

  const lessons = scheduleQuery.data?.lessons ?? []

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lessons.filter((lesson) => {
      if (statusFilter && lesson.status !== statusFilter) return false
      if (!q) return true
      const student = lesson.studentId?.name?.toLowerCase() || ''
      const coach = lesson.coachId?.name?.toLowerCase() || ''
      const category = lesson.enrollmentId?.categoryCode?.toLowerCase() || ''
      return student.includes(q) || coach.includes(q) || category.includes(q)
    })
  }, [lessons, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE))
  const paginatedLessons = filteredLessons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns = [
    {
      key: 'scheduledAt',
      label: 'التاريخ',
      render: (lesson) => formatDateTime(lesson.scheduledAt),
    },
    {
      key: 'student',
      label: 'الطالب',
      render: (lesson) => lesson.studentId?.name || '—',
    },
    {
      key: 'coach',
      label: 'المدرب',
      render: (lesson) => lesson.coachId?.name || '—',
    },
    {
      key: 'category',
      label: 'الفئة',
      render: (lesson) => (
        <Badge variant="secondary">
          {lesson.enrollmentId?.categoryCode || '—'}
          {lesson.enrollmentId?.subTypeCode ? ` ${lesson.enrollmentId.subTypeCode}` : ''}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (lesson) => (
        <StatusBadge
          status={lesson.status}
          label={LESSON_STATUS_LABELS[lesson.status] || lesson.status}
        />
      ),
    },
  ]

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="الجدول الشامل"
        description="دروس عملية مجدولة لهذا الأسبوع في مدرستك"
      />

      <div className="mb-comfortable flex flex-col gap-comfortable sm:flex-row">
        <SearchInput
          className="flex-1"
          placeholder="بحث بالطالب أو المدرب..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Select
          wrapperClassName="sm:w-48"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          options={STATUS_FILTER_OPTIONS}
        />
      </div>

      <Card title="دروس الأسبوع" padding="none">
        {scheduleQuery.isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={6} cols={5} /></div>
        ) : scheduleQuery.error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(scheduleQuery.error)}</Alert>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedLessons}
              emptyLabel="لا دروس مجدولة"
              emptyPreset="no-data"
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
