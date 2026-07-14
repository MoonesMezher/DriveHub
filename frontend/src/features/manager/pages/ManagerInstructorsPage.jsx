import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, Select, Checkbox, StatusBadge,
} from '@/components/ui'
import { managerService, licenseService } from '@/lib/services'
import { unwrap, unwrapList } from '@/lib/helpers/api'
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
    name: '',
    phone: '',
    password: '',
    licenseCategories: [],
    gender: 'male',
    isFemaleCoach: false,
  })

  const licensesQuery = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => unwrapList(await licenseService.list(), ['licenses']),
  })
  const licenses = licensesQuery.data ?? []

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
      setForm({
        email: '',
        name: '',
        phone: '',
        password: '',
        licenseCategories: [],
        gender: 'male',
        isFemaleCoach: false,
      })
      queryClient.invalidateQueries({ queryKey: ['manager', 'instructors'] })
    },
    onError: (err) => toast.error(err, 'فشل تعيين المدرب'),
  })

  const handleAssign = (e) => {
    e.preventDefault()
    if (!form.licenseCategories.length) {
      toast.error('اختر فئة رخصة واحدة على الأقل')
      return
    }
    assignMutation.mutate({
      email: form.email.trim(),
      schoolId,
      licenseCategories: form.licenseCategories,
      gender: form.gender,
      isFemaleCoach: form.isFemaleCoach,
      ...(form.name.trim() ? { name: form.name.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.password ? { password: form.password } : {}),
    })
  }

  const toggleLicenseCategory = (code) => {
    setForm((f) => ({
      ...f,
      licenseCategories: f.licenseCategories.includes(code)
        ? f.licenseCategories.filter((c) => c !== code)
        : [...f.licenseCategories, code],
    }))
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

        <Card title="إضافة مدرب" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleAssign}>
            <FormSection description="أدخل بريد مدرب موجود للتعيين، أو أضف الاسم وكلمة المرور لإنشاء حساب جديد">
              <Input
                label="البريد الإلكتروني"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="coach@drivehub.local"
                required
              />
              <Input
                label="الاسم (لحساب جديد)"
                name="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="اسم المدرب"
              />
              <Input
                label="الهاتف (اختياري)"
                name="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="كلمة المرور (لحساب جديد)"
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="8 أحرف على الأقل"
              />
              <div>
                <p className="mb-2 text-label-md text-on-surface">فئات الرخص</p>
                <div className="flex flex-wrap gap-3">
                  {licenses.map((license) => (
                    <Checkbox
                      key={license.code}
                      label={`${license.code} — ${license.name}`}
                      checked={form.licenseCategories.includes(license.code)}
                      onChange={() => toggleLicenseCategory(license.code)}
                    />
                  ))}
                </div>
              </div>
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
                {assignMutation.isPending ? 'جاري الحفظ…' : 'حفظ المدرب'}
              </Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
