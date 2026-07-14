import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  DataTable,
  Pagination,
  SkeletonTable,
  Alert,
  FormSection,
  SearchInput,
  Badge,
  LicenseCategorySelect,
  Select,
  ImageUploadField,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { mediaService } from '@/lib/services'

const PAGE_SIZE = 10

const PHASE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `المرحلة ${i + 1}`,
}))

export const ManagerContentPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    categoryCode: '',
    subTypeCode: '',
    phase: '1',
    title: '',
    body: '',
    order: '0',
    imageUrl: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  const contentQuery = useQuery({
    queryKey: ['manager', 'theory-content'],
    queryFn: () => managerService.listTheoryContent().then(unwrap),
  })

  const items = contentQuery.data?.items ?? []

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q)
        || item.categoryCode?.toLowerCase().includes(q)
        || String(item.phase).includes(q),
    )
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const paginatedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const createMutation = useMutation({
    mutationFn: (data) => managerService.createTheoryContent(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إنشاء المقال النظري')
      setForm({
        categoryCode: '',
        subTypeCode: '',
        phase: '1',
        title: '',
        body: '',
        order: '0',
        imageUrl: '',
      })
      queryClient.invalidateQueries({ queryKey: ['manager', 'theory-content'] })
    },
    onError: (err) => toast.error(err, 'فشل إنشاء المقال'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim() || !form.categoryCode) {
      toast.error('العنوان والمحتوى والفئة مطلوبة')
      return
    }
    createMutation.mutate({
      categoryCode: form.categoryCode.trim().toUpperCase(),
      subTypeCode: form.subTypeCode.trim() || undefined,
      phase: Number(form.phase),
      title: form.title.trim(),
      body: form.body.trim(),
      order: Number(form.order) || 0,
      imageUrl: form.imageUrl || undefined,
    })
  }

  const handleImageUpload = async (file) => {
    setUploadingImage(true)
    try {
      const result = await mediaService.upload(file, { category: 'content' })
      setForm((f) => ({ ...f, imageUrl: result.media.url }))
      toast.success('تم رفع صورة المقال')
    } finally {
      setUploadingImage(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'العنوان',
      render: (item) => item.title || '—',
    },
    {
      key: 'category',
      label: 'الفئة',
      render: (item) =>
        `${item.categoryCode}${item.subTypeCode ? ` (${item.subTypeCode})` : ''}`,
    },
    {
      key: 'phase',
      label: 'المرحلة',
      render: (item) => item.phase ?? '—',
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (item) => (
        <Badge variant={item.isActive !== false ? 'success' : 'default'}>
          {item.isActive !== false ? 'نشط' : 'معطّل'}
        </Badge>
      ),
    },
  ]

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="محرر المحتوى النظري"
        description="إنشاء مقالات نظرية جديدة للطلاب (عنوان، محتوى، فئة، مرحلة)"
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالعنوان أو الفئة..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="grid gap-loose xl:grid-cols-[1fr_400px]">
        <Card title="المقالات الحالية" padding="none">
          {contentQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={4} /></div>
          ) : contentQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(contentQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={paginatedItems}
                emptyLabel="لا توجد مقالات نظرية"
                emptyPreset="no-data"
              />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card title="مقال نظري جديد" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleCreate}>
            <FormSection description="أضف درساً نظرياً جديداً للمنصة">
              <Input
                label="العنوان"
                name="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: إشارات المرور الأساسية"
                required
              />
              <LicenseCategorySelect
                value={form.categoryCode}
                onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
                required
              />
              <Input
                label="النوع الفرعي (اختياري)"
                name="subTypeCode"
                value={form.subTypeCode}
                onChange={(e) => setForm((f) => ({ ...f, subTypeCode: e.target.value }))}
              />
              <Select
                label="المرحلة"
                name="phase"
                value={form.phase}
                onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}
                options={PHASE_OPTIONS}
                required
              />
              <Input
                label="الترتيب"
                name="order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              />
              <ImageUploadField
                label="صورة المقال (اختياري)"
                value={form.imageUrl}
                onUpload={handleImageUpload}
                uploading={uploadingImage}
                category="content"
              />
              <Textarea
                label="المحتوى"
                name="body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={8}
                placeholder="نص الدرس النظري..."
                required
              />
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                نشر المقال
              </Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
