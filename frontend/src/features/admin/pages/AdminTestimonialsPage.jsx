import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, Textarea, Badge,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 10
const EMPTY_FORM = {
  name: '',
  role: '',
  quote: '',
  rating: '',
  avatar: '',
  order: '0',
  isActive: true,
}

export const AdminTestimonialsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)

  const testimonialsQuery = useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: () => adminService.listTestimonials().then(unwrap),
  })

  const items = testimonialsQuery.data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
    queryClient.invalidateQueries({ queryKey: ['testimonials'] })
  }

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createTestimonial(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إضافة الرأي')
      setForm(EMPTY_FORM)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل الإضافة'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateTestimonial(id, data).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث الرأي')
      setForm(EMPTY_FORM)
      setEditingId(null)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل التحديث'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteTestimonial(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم حذف الرأي')
      if (editingId) {
        setForm(EMPTY_FORM)
        setEditingId(null)
      }
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل الحذف'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminService.updateTestimonial(id, { isActive }).then(unwrap),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err, 'فشل تغيير الحالة'),
  })

  const loadForEdit = (item) => {
    setEditingId(item._id)
    setForm({
      name: item.name || '',
      role: item.role || '',
      quote: item.quote || '',
      rating: item.rating != null ? String(item.rating) : '',
      avatar: item.avatar || '',
      order: String(item.order ?? 0),
      isActive: item.isActive !== false,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      quote: form.quote.trim(),
      rating: form.rating ? Number(form.rating) : null,
      avatar: form.avatar.trim(),
      order: Number(form.order) || 0,
      isActive: form.isActive,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (item) => {
    if (window.confirm(`حذف رأي «${item.name}»؟`)) {
      deleteMutation.mutate(item._id)
    }
  }

  const moveOrder = (item, delta) => {
    updateMutation.mutate({
      id: item._id,
      data: { order: Math.max(0, (item.order ?? 0) + delta) },
    })
  }

  const columns = useMemo(() => [
    { key: 'order', label: 'الترتيب' },
    {
      key: 'name',
      label: 'الاسم',
      render: (row) => (
        <span className="text-body-sm font-medium">{row.name}</span>
      ),
    },
    {
      key: 'quote',
      label: 'الاقتباس',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-body-sm">{row.quote}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'الحالة',
      render: (row) => (
        <Badge variant={row.isActive !== false ? 'success' : 'default'}>
          {row.isActive !== false ? 'نشط' : 'معطّل'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={() => loadForEdit(row)}>
            تعديل
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleActiveMutation.mutate({ id: row._id, isActive: row.isActive === false })}
            disabled={toggleActiveMutation.isPending}
          >
            {row.isActive !== false ? 'تعطيل' : 'تفعيل'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => moveOrder(row, -1)} title="رفع">
            ↑
          </Button>
          <Button size="sm" variant="ghost" onClick={() => moveOrder(row, 1)} title="خفض">
            ↓
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-error"
            onClick={() => handleDelete(row)}
            disabled={deleteMutation.isPending}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ], [deleteMutation.isPending, toggleActiveMutation.isPending])

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="ماذا يقول المتعلّمون"
        description="إدارة آراء المتعلّمين — تظهر في الصفحة الرئيسية"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_400px]">
        <Card title="قائمة الآراء" padding="none">
          {testimonialsQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={5} /></div>
          ) : testimonialsQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(testimonialsQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginated} emptyLabel="لا آراء بعد" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card
          title={editingId ? 'تعديل رأي' : 'إضافة رأي'}
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <form onSubmit={handleSubmit}>
            <FormSection description="الآراء النشطة فقط تظهر للزوار مرتبة حسب رقم الترتيب">
              <Input
                label="الاسم"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                label="الصفة (اختياري)"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                hint="مثال: طالب، متخرج"
              />
              <Textarea
                label="الاقتباس"
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                rows={4}
                required
              />
              <Input
                label="التقييم (1–5، اختياري)"
                type="number"
                min={1}
                max={5}
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              />
              <Input
                label="صورة شخصية (اختياري)"
                value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                hint="معرّف وسائط أو /api/v1/media/:id"
              />
              <Input
                label="ترتيب العرض"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-body-md">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                نشط (يظهر للزوار)
              </label>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {editingId ? 'حفظ التعديل' : 'إضافة'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setForm(EMPTY_FORM); setEditingId(null) }}
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
