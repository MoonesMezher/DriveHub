import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, Select, Checkbox, StatusBadge,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

const PAGE_SIZE = 10

const instructorStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const instructorStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
]

export const ManagerInstructorsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    email: '',
    licenseCategories: '',
    gender: 'male',
    isFemaleCoach: false,
  })

  const instructorsQuery = useQuery({
    queryKey: ['manager', 'instructors'],
    queryFn: () => managerService.listInstructors().then(unwrap),
  })

  const instructors = instructorsQuery.data?.instructors ?? []

  const filteredInstructors = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return instructors
    return instructors.filter(
      (i) =>
        i.userId?.name?.toLowerCase().includes(q)
        || i.userId?.email?.toLowerCase().includes(q)
        || (i.licenseCategories || []).some((c) => c.toLowerCase().includes(q)),
    )
  }, [instructors, search])

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / PAGE_SIZE))
  const paginatedInstructors = filteredInstructors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const assignMutation = useMutation({
    mutationFn: (data) => managerService.assignInstructor(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم تعيين المدرب')
      setForm({ email: '', licenseCategories: '', gender: 'male', isFemaleCoach: false })
      queryClient.invalidateQueries({ queryKey: ['manager', 'instructors'] })
    },
    onError: (err) => toast.error(err, 'فشل تعيين المدرب'),
  })

  const handleAssign = (e) => {
    e.preventDefault()
    assignMutation.mutate({
      email: form.email.trim(),
      schoolId,
      licenseCategories: form.licenseCategories
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
      gender: form.gender,
      isFemaleCoach: form.isFemaleCoach,
    })
  }

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      render: (instructor) => instructor.userId?.name || '—',
    },
    {
      key: 'email',
      label: 'البريد',
      render: (instructor) => instructor.userId?.email || '—',
    },
    {
      key: 'categories',
      label: 'الفئات',
      render: (instructor) => (instructor.licenseCategories || []).join(', ') || '—',
    },
    {
      key: 'gender',
      label: 'الجنس',
      render: (instructor) =>
        instructor.gender === 'female' ? 'أنثى' : instructor.gender === 'male' ? 'ذكر' : '—',
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (instructor) => (
        <StatusBadge
          status={instructor.status}
          labels={instructorStatusLabels}
          variants={instructorStatusVariants}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="المدربون"
        description="عرض المدربين وتعيين مدرب جديد للمدرسة"
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="قائمة المدربين" padding="none">
          {instructorsQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={5} /></div>
          ) : instructorsQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(instructorsQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={paginatedInstructors}
                emptyLabel="لا يوجد مدربون"
              />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card title="تعيين مدرب" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleAssign}>
            <FormSection>
              <Input
                label="البريد الإلكتروني للمدرب"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="coach@drivehub.local"
                required
              />
              <Input
                label="فئات الرخص (مفصولة بفاصلة)"
                name="licenseCategories"
                value={form.licenseCategories}
                onChange={(e) => setForm((f) => ({ ...f, licenseCategories: e.target.value }))}
                placeholder="B, C"
                required
              />
              <Select
                label="الجنس"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                options={GENDER_OPTIONS}
              />
              <Checkbox
                label="مدربة (للطلاب الإناث)"
                checked={form.isFemaleCoach}
                onChange={(e) => setForm((f) => ({ ...f, isFemaleCoach: e.target.checked }))}
              />
              <Button type="submit" className="w-full" disabled={assignMutation.isPending}>
                تعيين
              </Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
