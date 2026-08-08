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
import { InstructorDetailPanel } from '../components/InstructorDetailPanel'

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
  const [selectedInstructorId, setSelectedInstructorId] = useState(null)
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

  const instructorDetailQuery = useQuery({
    queryKey: ['manager', 'instructors', selectedInstructorId],
    queryFn: () => managerService.getInstructor(selectedInstructorId).then(unwrap),
    enabled: Boolean(selectedInstructorId),
  })

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

  const selectedFromList = useMemo(
    () => instructors.find((i) => i._id === selectedInstructorId) || null,
    [instructors, selectedInstructorId],
  )

  const selectedInstructor = instructorDetailQuery.data?.instructor || selectedFromList

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

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => managerService.updateInstructor(id, { status }).then(unwrap),
    onSuccess: (data) => {
      toast.success(data?.instructor?.status === 'suspended' ? 'تم إيقاف المدرب' : 'تم إعادة تفعيل المدرب')
      queryClient.invalidateQueries({ queryKey: ['manager', 'instructors'] })
    },
    onError: (err) => toast.error(err, 'فشل تحديث حالة المدرب'),
  })

  const handleAssign = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('اسم المدرب مطلوب')
      return
    }
    if (!form.password) {
      toast.error('كلمة المرور مطلوبة ليتمكن المدرب من تسجيل الدخول')
      return
    }
    if (!form.licenseCategories.length) {
      toast.error('اختر فئة رخصة واحدة على الأقل')
      return
    }
    assignMutation.mutate({
      email: form.email.trim(),
      schoolId,
      name: form.name.trim(),
      password: form.password,
      licenseCategories: form.licenseCategories,
      gender: form.gender,
      isFemaleCoach: form.isFemaleCoach,
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
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

  const toggleInstructor = (instructor) => {
    setSelectedInstructorId((current) => (current === instructor._id ? null : instructor._id))
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
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="المدربون"
        description="عرض المدربين وتعيين مدرب جديد للمدرسة — اضغط على صف لعرض التفاصيل الكاملة"
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
                onRowClick={toggleInstructor}
                rowClassName={(row) => (
                  selectedInstructorId === row._id
                    ? 'bg-primary-container/30 hover:bg-primary-container/40'
                    : undefined
                )}
              />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
              {selectedInstructorId && instructorDetailQuery.isError && !selectedFromList && (
                <div className="p-comfortable">
                  <Alert variant="error" title="تعذر تحميل التفاصيل">
                    {getErrorMessage(instructorDetailQuery.error)}
                  </Alert>
                </div>
              )}
              {selectedInstructor && (
                <InstructorDetailPanel
                  instructor={selectedInstructor}
                  onClose={() => setSelectedInstructorId(null)}
                  statusPending={statusMutation.isPending}
                  onToggleStatus={(instructor) => {
                    statusMutation.mutate({
                      id: instructor._id,
                      status: instructor.status === 'active' ? 'suspended' : 'active',
                    })
                  }}
                />
              )}
            </>
          )}
        </Card>

        <Card title="إضافة مدرب" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleAssign}>
            <FormSection description="أدخل بيانات المدرب مع كلمة مرور إلزامية لتسجيل الدخول من بوابة المدرسة">
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
                label="اسم المدرب"
                name="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="اسم المدرب"
                required
              />
              <Input
                label="الهاتف (اختياري)"
                name="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                label="كلمة المرور (لتسجيل الدخول)"
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="8 أحرف + حرف كبير وصغير ورقم ورمز"
                required
                hint="مطلوبة دائماً حتى يتمكن المدرب من تسجيل الدخول"
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
