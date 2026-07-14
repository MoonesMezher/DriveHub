import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, Textarea, Badge, Select, Icon,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import {
  EMPTY_PREREQUISITE,
  PREREQUISITE_TYPES,
  formatPrerequisiteSummary,
  normalizePrerequisites,
} from '@/lib/constants/licensePrerequisites'

const PAGE_SIZE = 10
const EMPTY_FORM = {
  code: '',
  name: '',
  briefDesc: '',
  fullDesc: '',
  requirementsIntro: 'ما تحتاجه قبل التقديم',
  minAge: '18',
  prerequisites: [],
  vehicleTypes: '',
  order: '0',
  isActive: true,
}

export const AdminLicensesPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingCode, setEditingCode] = useState(null)

  const licensesQuery = useQuery({
    queryKey: ['admin', 'licenses'],
    queryFn: () => adminService.listLicenses().then(unwrap),
  })

  const licenses = licensesQuery.data?.licenses ?? []
  const totalPages = Math.max(1, Math.ceil(licenses.length / PAGE_SIZE))
  const paginated = licenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'licenses'] })
    queryClient.invalidateQueries({ queryKey: ['licenses'] })
  }

  const upsertMutation = useMutation({
    mutationFn: (data) => adminService.upsertLicense(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم حفظ فئة الرخصة')
      setForm(EMPTY_FORM)
      setEditingCode(null)
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل حفظ الفئة'),
  })

  const loadForEdit = (license) => {
    setEditingCode(license.code)
    setForm({
      code: license.code,
      name: license.name || '',
      briefDesc: license.briefDesc || '',
      fullDesc: license.fullDesc || '',
      requirementsIntro: license.requirementsIntro || 'ما تحتاجه قبل التقديم',
      minAge: String(license.minAge ?? 18),
      prerequisites: normalizePrerequisites(license.prerequisites),
      vehicleTypes: license.vehicleTypes || '',
      order: String(license.order ?? 0),
      isActive: license.isActive !== false,
    })
  }

  const updatePrerequisite = (index, field, value) => {
    setForm((current) => {
      const prerequisites = [...current.prerequisites]
      prerequisites[index] = { ...prerequisites[index], [field]: value }
      return { ...current, prerequisites }
    })
  }

  const addPrerequisite = () => {
    setForm((current) => ({
      ...current,
      prerequisites: [...current.prerequisites, { ...EMPTY_PREREQUISITE }],
    }))
  }

  const removePrerequisite = (index) => {
    setForm((current) => ({
      ...current,
      prerequisites: current.prerequisites.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    upsertMutation.mutate({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      briefDesc: form.briefDesc.trim(),
      fullDesc: form.fullDesc.trim(),
      requirementsIntro: form.requirementsIntro.trim() || 'ما تحتاجه قبل التقديم',
      minAge: Number(form.minAge),
      prerequisites: normalizePrerequisites(form.prerequisites),
      vehicleTypes: form.vehicleTypes.trim(),
      order: Number(form.order) || 0,
      isActive: form.isActive,
    })
  }

  const columns = useMemo(() => [
    { key: 'code', label: 'الرمز' },
    { key: 'name', label: 'الاسم' },
    { key: 'minAge', label: 'الحد الأدنى للعمر' },
    {
      key: 'prerequisites',
      label: 'المتطلبات',
      render: (row) => formatPrerequisiteSummary(row.prerequisites) || '—',
    },
    {
      key: 'briefDesc',
      label: 'نظرة عامة',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-body-sm">{row.briefDesc || '—'}</span>
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
        <Button size="sm" variant="outline" onClick={() => loadForEdit(row)}>
          تعديل
        </Button>
      ),
    },
  ], [])

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="فئات الرخص"
        description="إدارة الشروط والأعمار والأوصاف — تظهر في صفحات /licenses للزوار"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_420px]">
        <Card title="فئات الرخص" padding="none">
          {licensesQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={6} /></div>
          ) : licensesQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(licensesQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginated} emptyLabel="لا توجد فئات" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card
          title={editingCode ? `تعديل ${editingCode}` : 'إضافة / تحديث فئة'}
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <form onSubmit={handleSubmit} className="space-y-loose">
            <FormSection title="البيانات الأساسية">
              <Input
                label="رمز الفئة"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                required
                disabled={Boolean(editingCode)}
                maxLength={3}
              />
              <Input
                label="اسم الفئة"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
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
            </FormSection>

            <FormSection title="نظرة عامة" description="يظهر في بطاقة النظرة العامة بصفحة الرخصة">
              <Input
                label="وصف مختصر (شارة)"
                value={form.briefDesc}
                onChange={(e) => setForm((f) => ({ ...f, briefDesc: e.target.value }))}
                hint='مثال: "حتى 10 ركاب"'
              />
              <Textarea
                label="وصف تفصيلي"
                value={form.fullDesc}
                onChange={(e) => setForm((f) => ({ ...f, fullDesc: e.target.value }))}
                rows={4}
              />
              <Input
                label="أنواع المركبات"
                value={form.vehicleTypes}
                onChange={(e) => setForm((f) => ({ ...f, vehicleTypes: e.target.value }))}
              />
            </FormSection>

            <FormSection title="المتطلبات" description="قسم المتطلبات في صفحة الرخصة العامة">
              <Input
                label="مقدمة قسم المتطلبات"
                value={form.requirementsIntro}
                onChange={(e) => setForm((f) => ({ ...f, requirementsIntro: e.target.value }))}
                hint='مثال: "ما تحتاجه قبل التقديم"'
              />
              <Input
                label="الحد الأدنى للعمر"
                type="number"
                min={16}
                max={80}
                value={form.minAge}
                onChange={(e) => setForm((f) => ({ ...f, minAge: e.target.value }))}
                required
              />

              <div className="space-y-comfortable">
                <div className="flex items-center justify-between">
                  <p className="text-body-md font-medium text-on-surface">عناصر المتطلبات</p>
                  <Button type="button" size="sm" variant="outline" onClick={addPrerequisite}>
                    إضافة متطلب
                  </Button>
                </div>

                {form.prerequisites.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-outline-variant p-comfortable text-body-sm text-on-surface-variant">
                    لا توجد متطلبات — أضف رخصاً سابقة أو متطلبات أساسية/طبية.
                  </p>
                ) : (
                  form.prerequisites.map((item, index) => (
                    <div
                      key={`prereq-${index}`}
                      className="space-y-comfortable rounded-xl border border-outline-variant/60 bg-surface-container-low p-comfortable"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-body-sm font-medium text-on-surface-variant">
                          متطلب {index + 1}
                        </span>
                        <button
                          type="button"
                          className="text-error hover:opacity-80"
                          onClick={() => removePrerequisite(index)}
                          aria-label="حذف المتطلب"
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                      <Input
                        label="النص المعروض"
                        value={item.label}
                        onChange={(e) => updatePrerequisite(index, 'label', e.target.value)}
                        hint='مثال: "رخصة B مسبقاً"'
                      />
                      <div className="grid gap-comfortable sm:grid-cols-2">
                        <Select
                          label="النوع"
                          value={item.type}
                          onChange={(e) => updatePrerequisite(index, 'type', e.target.value)}
                          options={PREREQUISITE_TYPES}
                        />
                        <Input
                          label="رمز الرخصة (اختياري)"
                          value={item.code}
                          onChange={(e) => updatePrerequisite(index, 'code', e.target.value.toUpperCase())}
                          maxLength={3}
                          disabled={item.type !== 'license'}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-body-sm">
                        <input
                          type="checkbox"
                          checked={item.isRequired}
                          onChange={(e) => updatePrerequisite(index, 'isRequired', e.target.checked)}
                        />
                        متطلب إلزامي
                      </label>
                    </div>
                  ))
                )}
              </div>
            </FormSection>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={upsertMutation.isPending}>
                حفظ
              </Button>
              {editingCode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setForm(EMPTY_FORM); setEditingCode(null) }}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
