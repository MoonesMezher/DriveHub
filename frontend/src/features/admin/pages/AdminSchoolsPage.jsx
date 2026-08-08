import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, GovernorateSelect, DataTable, Pagination,
  SkeletonTable, Alert, FormSection, SearchInput, StatusBadge,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { SchoolDetailPanel } from '../components/SchoolDetailPanel'

const PAGE_SIZE = 10

const schoolStatusLabels = {
  active: 'نشطة',
  suspended: 'موقوفة',
  deleted: 'محذوفة',
}

const schoolStatusVariants = {
  active: 'success',
  suspended: 'error',
  deleted: 'default',
}

const extractSchools = (payload) => {
  const node = payload?.schools
  return Array.isArray(node) ? node : node?.schools ?? []
}

const emptySchoolForm = {
  name: '',
  address: '',
  governorate: '',
  description: '',
  phone: '',
  email: '',
  lat: '33.5138',
  lng: '36.2765',
  licenses: 'B',
}

export const AdminSchoolsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSchoolId, setSelectedSchoolId] = useState(null)
  const [form, setForm] = useState(emptySchoolForm)

  const schoolsQuery = useQuery({
    queryKey: ['admin', 'schools'],
    queryFn: () => adminService.listSchools().then(unwrap),
  })

  const schools = extractSchools(schoolsQuery.data)

  const schoolDetailQuery = useQuery({
    queryKey: ['admin', 'schools', selectedSchoolId],
    queryFn: () => adminService.getSchool(selectedSchoolId).then(unwrap),
    enabled: Boolean(selectedSchoolId),
  })

  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return schools
    return schools.filter(
      (s) =>
        s.name?.toLowerCase().includes(q)
        || s.governorate?.toLowerCase().includes(q)
        || s.address?.toLowerCase().includes(q),
    )
  }, [schools, search])

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / PAGE_SIZE))
  const paginatedSchools = filteredSchools.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedFromList = useMemo(
    () => schools.find((s) => s._id === selectedSchoolId) || null,
    [schools, selectedSchoolId],
  )

  const selectedSchool = schoolDetailQuery.data?.school || selectedFromList

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createSchool(data).then(unwrap),
    onSuccess: () => {
      toast.success('تمت إضافة المدرسة')
      setForm(emptySchoolForm)
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] })
    },
    onError: (err) => toast.error(err, 'فشل إضافة المدرسة'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.updateSchool(id, { status }).then(unwrap),
    onSuccess: (data) => {
      const next = data?.status || data?.school?.status
      toast.success(next === 'suspended' ? 'تم إيقاف المدرسة' : 'تم إعادة تفعيل المدرسة')
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] })
    },
    onError: (err) => toast.error(err, 'فشل تحديث حالة المدرسة'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteSchool(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم حذف المدرسة')
      setSelectedSchoolId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'schools'] })
    },
    onError: (err) => toast.error(err, 'تعذّر حذف المدرسة'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate({
      name: form.name.trim(),
      address: form.address.trim(),
      governorate: form.governorate.trim() || undefined,
      description: form.description.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      lat: Number(form.lat),
      lng: Number(form.lng),
      licenses: form.licenses.split(',').map((l) => l.trim().toUpperCase()).filter(Boolean),
    })
  }

  const toggleSchool = (school) => {
    setSelectedSchoolId((prev) => (prev === school._id ? null : school._id))
  }

  const confirmDelete = (school) => {
    if (window.confirm(`حذف مدرسة «${school.name}»؟ لا يُسمح إن وُجدت دورات أو اشتراكات نشطة.`)) {
      deleteMutation.mutate(school._id)
    }
  }

  const columns = [
    { key: 'name', label: 'الاسم', render: (school) => <span className="font-medium">{school.name}</span> },
    { key: 'governorate', label: 'المحافظة', render: (school) => school.governorate || '—' },
    { key: 'address', label: 'العنوان', render: (school) => school.address || '—' },
    {
      key: 'licenses',
      label: 'الفئات',
      render: (school) => (school.licenses || []).join(', ') || '—',
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (school) => (
        <StatusBadge
          status={school.status}
          labels={schoolStatusLabels}
          variants={schoolStatusVariants}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'تاريخ التسجيل',
      render: (school) => formatDate(school.createdAt),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (school) =>
        school.status !== 'deleted' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              confirmDelete(school)
            }}
            disabled={deleteMutation.isPending}
          >
            حذف
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="المدارس"
        description="عرض المدارس أو إضافة مدرسة جديدة مباشرة (بدون طلب)"
        actions={
          <Button variant="ultra" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'إلغاء' : 'إضافة مدرسة'}
          </Button>
        }
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالاسم أو المحافظة..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {showForm && (
        <Card title="إضافة مدرسة جديدة" className="mb-loose">
          <form onSubmit={handleCreate}>
            <FormSection className="grid gap-4 sm:grid-cols-2">
              <Input label="اسم المدرسة" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              <GovernorateSelect
                value={form.governorate}
                onChange={(e) => setForm((f) => ({ ...f, governorate: e.target.value }))}
              />
              <Input label="العنوان" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required className="sm:col-span-2" />
              <Input label="الهاتف" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input label="البريد" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <Input label="خط العرض" type="number" step="any" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} required />
              <Input label="خط الطول" type="number" step="any" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} required />
              <Input label="الرخص (مفصولة بفاصلة)" value={form.licenses} onChange={(e) => setForm((f) => ({ ...f, licenses: e.target.value }))} hint="مثال: B, C" className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>حفظ المدرسة</Button>
              </div>
            </FormSection>
          </form>
        </Card>
      )}

      <Card padding="none">
        {schoolsQuery.isLoading ? (
          <div className="p-comfortable"><SkeletonTable rows={6} cols={7} /></div>
        ) : schoolsQuery.error ? (
          <div className="p-comfortable">
            <Alert variant="error" title="حدث خطأ">{getErrorMessage(schoolsQuery.error)}</Alert>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={paginatedSchools}
              emptyLabel="لا توجد مدارس"
              onRowClick={toggleSchool}
              rowClassName={(row) => (
                selectedSchoolId === row._id
                  ? 'bg-primary-container/30 hover:bg-primary-container/40'
                  : undefined
              )}
            />
            <div className="border-t border-outline-variant/50 p-comfortable">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
            {selectedSchoolId && schoolDetailQuery.isError && !selectedFromList && (
              <div className="p-comfortable">
                <Alert variant="error" title="تعذر تحميل التفاصيل">
                  {getErrorMessage(schoolDetailQuery.error)}
                </Alert>
              </div>
            )}
            {selectedSchool && (
              <SchoolDetailPanel
                school={selectedSchool}
                onClose={() => setSelectedSchoolId(null)}
                statusPending={statusMutation.isPending}
                deletePending={deleteMutation.isPending}
                onToggleStatus={(school) => {
                  statusMutation.mutate({
                    id: school._id,
                    status: school.status === 'active' ? 'suspended' : 'active',
                  })
                }}
                onDelete={confirmDelete}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
