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
  question: '',
  answer: '',
  category: '',
  order: '0',
  isActive: true,
}

export const AdminFaqPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)

  const faqQuery = useQuery({
    queryKey: ['admin', 'faq'],
    queryFn: () => adminService.listFaq().then(unwrap),
  })

  const items = faqQuery.data?.items ?? []
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'faq'] })
    queryClient.invalidateQueries({ queryKey: ['faq'] })
  }

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createFaq(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إضافة السؤال')
      setForm(EMPTY_FORM)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل الإضافة'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateFaq(id, data).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث السؤال')
      setForm(EMPTY_FORM)
      setEditingId(null)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل التحديث'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteFaq(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم حذف السؤال')
      if (editingId) {
        setForm(EMPTY_FORM)
        setEditingId(null)
      }
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل الحذف'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminService.updateFaq(id, { isActive }).then(unwrap),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err, 'فشل تغيير الحالة'),
  })

  const loadForEdit = (item) => {
    setEditingId(item._id)
    setForm({
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || '',
      order: String(item.order ?? 0),
      isActive: item.isActive !== false,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim(),
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
    if (window.confirm(`حذف السؤال «${item.question}»؟`)) {
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
      key: 'question',
      label: 'السؤال',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-body-sm font-medium">{row.question}</span>
      ),
    },
    {
      key: 'category',
      label: 'التصنيف',
      render: (row) => row.category || '—',
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
        title="الأسئلة الشائعة"
        description="إدارة الأسئلة والأجوبة — تظهر في صفحة /faq للزوار"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_400px]">
        <Card title="قائمة الأسئلة" padding="none">
          {faqQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={5} /></div>
          ) : faqQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(faqQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginated} emptyLabel="لا أسئلة بعد" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card
          title={editingId ? 'تعديل سؤال' : 'إضافة سؤال'}
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <form onSubmit={handleSubmit}>
            <FormSection description="الأسئلة النشطة فقط تظهر للزوار مرتبة حسب رقم الترتيب">
              <Input
                label="السؤال"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                required
              />
              <Textarea
                label="الإجابة"
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                rows={5}
                required
              />
              <Input
                label="التصنيف (اختياري)"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                hint="مثال: التسجيل، الدفع"
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
