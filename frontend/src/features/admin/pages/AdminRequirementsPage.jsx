import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, Textarea, Badge, ImageUploadField, Tabs, Select,
} from '@/components/ui'
import { adminService, mediaService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import {
  REQUIREMENT_SECTIONS,
  REQUIREMENT_SECTION_TABS,
} from '@/lib/constants/requirementSections'

const PAGE_SIZE = 10

const emptyFormFor = (section) => ({
  section,
  title: '',
  description: '',
  icon: '',
  category: '',
  imageUrl: '',
  order: '0',
  isActive: true,
})

const SECTION_META = Object.fromEntries(
  REQUIREMENT_SECTION_TABS.map((tab) => [tab.id, tab]),
)

export const AdminRequirementsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [section, setSection] = useState(REQUIREMENT_SECTIONS.JOURNEY)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(() => emptyFormFor(REQUIREMENT_SECTIONS.JOURNEY))
  const [editingId, setEditingId] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const requirementsQuery = useQuery({
    queryKey: ['admin', 'requirements'],
    queryFn: () => adminService.listRequirements().then(unwrap),
  })

  const allItems = requirementsQuery.data?.items ?? []
  const items = useMemo(
    () => allItems.filter((item) => (item.section || REQUIREMENT_SECTIONS.DOCUMENTS) === section),
    [allItems, section],
  )
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const meta = SECTION_META[section]

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'requirements'] })
    queryClient.invalidateQueries({ queryKey: ['requirements'] })
  }

  const switchSection = (next) => {
    setSection(next)
    setPage(1)
    setEditingId(null)
    setForm(emptyFormFor(next))
  }

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createRequirement(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إضافة العنصر')
      setForm(emptyFormFor(section))
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل الإضافة'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateRequirement(id, data).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث العنصر')
      setForm(emptyFormFor(section))
      setEditingId(null)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل التحديث'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteRequirement(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم حذف العنصر')
      if (editingId) {
        setForm(emptyFormFor(section))
        setEditingId(null)
      }
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل الحذف'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminService.updateRequirement(id, { isActive }).then(unwrap),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err, 'فشل تغيير الحالة'),
  })

  const loadForEdit = (item) => {
    setEditingId(item._id)
    setForm({
      section: item.section || section,
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || '',
      category: item.category || '',
      imageUrl: item.imageUrl || '',
      order: String(item.order ?? 0),
      isActive: item.isActive !== false,
    })
  }

  const handleImageUpload = async (file) => {
    setUploadingImage(true)
    try {
      const result = await mediaService.upload(file, { category: 'requirement' })
      setForm((f) => ({ ...f, imageUrl: result.media?.url || result.url || '' }))
      toast.success('تم رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      section: form.section || section,
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon.trim(),
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
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
    if (window.confirm(`حذف «${item.title}»؟`)) {
      deleteMutation.mutate(item._id)
    }
  }

  const moveOrder = (item, delta) => {
    updateMutation.mutate({
      id: item._id,
      data: { order: Math.max(0, (item.order ?? 0) + delta) },
    })
  }

  const showIcon = section === REQUIREMENT_SECTIONS.JOURNEY || section === REQUIREMENT_SECTIONS.DOCUMENTS
  const showImage = section === REQUIREMENT_SECTIONS.JOURNEY || section === REQUIREMENT_SECTIONS.DOCUMENTS
  const showDescription = section === REQUIREMENT_SECTIONS.DOCUMENTS || section === REQUIREMENT_SECTIONS.STEPS
  const descriptionRequired = section === REQUIREMENT_SECTIONS.DOCUMENTS

  const columns = useMemo(() => {
    const cols = [
      { key: 'order', label: 'الترتيب' },
      {
        key: 'title',
        label: 'العنوان',
        render: (row) => (
          <span className="line-clamp-2 max-w-xs text-body-sm font-medium">{row.title}</span>
        ),
      },
    ]
    if (showIcon) {
      cols.push({
        key: 'icon',
        label: 'الأيقونة',
        render: (row) => row.icon || '—',
      })
    }
    cols.push(
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
    )
    return cols
  }, [deleteMutation.isPending, toggleActiveMutation.isPending, showIcon])

  const isSaving = createMutation.isPending || updateMutation.isPending
  const formTitle = editingId ? 'تعديل عنصر' : 'إضافة عنصر'

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="متطلبات التسجيل"
        description="إدارة أقسام صفحة /requirements — الرحلة، المستندات، وخطوات التسجيل"
      />

      <Card className="mb-loose" padding="none">
        <Tabs
          tabs={REQUIREMENT_SECTION_TABS.map(({ id, label }) => ({ id, label }))}
          activeId={section}
          onChange={switchSection}
        />
      </Card>

      <div className="grid gap-loose xl:grid-cols-[1fr_400px]">
        <Card title={meta?.label || 'القائمة'} padding="none">
          {requirementsQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={5} /></div>
          ) : requirementsQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(requirementsQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginated} emptyLabel="لا عناصر في هذا القسم بعد" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card
          title={formTitle}
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <form onSubmit={handleSubmit}>
            <FormSection description={meta?.description || 'العناصر النشطة فقط تظهر للزوار مرتبة حسب رقم الترتيب'}>
              <Select
                label="القسم"
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                options={REQUIREMENT_SECTION_TABS.map((tab) => ({
                  value: tab.id,
                  label: tab.label,
                }))}
                required
              />
              <Input
                label="العنوان"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              {showDescription && (
                <Textarea
                  label="الوصف"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  required={descriptionRequired}
                  hint={section === REQUIREMENT_SECTIONS.STEPS ? 'اختياري لخطوات التسجيل' : undefined}
                />
              )}
              {showIcon && (
                <Input
                  label="أيقونة Material (اختياري)"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  hint="مثال: badge، person_add، health_and_safety"
                />
              )}
              {section === REQUIREMENT_SECTIONS.DOCUMENTS && (
                <Input
                  label="التصنيف (اختياري)"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              )}
              {showImage && (
                <ImageUploadField
                  label={section === REQUIREMENT_SECTIONS.JOURNEY ? 'صورة الخطوة (اختياري)' : 'صورة المتطلب (اختياري)'}
                  value={form.imageUrl}
                  onUpload={handleImageUpload}
                  uploading={uploadingImage}
                  category="requirement"
                />
              )}
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
                    onClick={() => { setForm(emptyFormFor(section)); setEditingId(null) }}
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
