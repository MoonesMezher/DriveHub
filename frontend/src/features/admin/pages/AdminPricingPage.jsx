import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatCurrency } from '@/lib/helpers/format'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 10

export const AdminPricingPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    categoryCode: '',
    subTypeCode: '',
    fixedPrice: '',
    currency: 'SYP',
  })
  const [commission, setCommission] = useState('')

  const pricingQuery = useQuery({
    queryKey: ['admin', 'pricing'],
    queryFn: () => adminService.listPricing().then(unwrap),
  })

  const pricing = pricingQuery.data?.pricing ?? []
  const totalPages = Math.max(1, Math.ceil(pricing.length / PAGE_SIZE))
  const paginatedPricing = pricing.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'pricing'] })

  const upsertMutation = useMutation({
    mutationFn: (data) => adminService.upsertPricing(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم حفظ التسعير')
      setForm({ categoryCode: '', subTypeCode: '', fixedPrice: '', currency: 'SYP' })
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل حفظ التسعير'),
  })

  const commissionMutation = useMutation({
    mutationFn: (value) => adminService.updateCommission(value).then(unwrap),
    onSuccess: () => toast.success('تم تحديث نسبة العمولة'),
    onError: (err) => toast.error(err, 'فشل تحديث العمولة'),
  })

  const handleUpsert = (e) => {
    e.preventDefault()
    upsertMutation.mutate({
      categoryCode: form.categoryCode.trim().toUpperCase(),
      subTypeCode: form.subTypeCode.trim() || undefined,
      fixedPrice: Number(form.fixedPrice),
      currency: form.currency.trim() || 'SYP',
    })
  }

  const handleCommission = (e) => {
    e.preventDefault()
    commissionMutation.mutate(Number(commission))
  }

  const columns = useMemo(() => [
    { key: 'categoryCode', label: 'الفئة' },
    { key: 'subTypeCode', label: 'النوع الفرعي', render: (row) => row.subTypeCode || '—' },
    {
      key: 'fixedPrice',
      label: 'السعر',
      render: (row) => formatCurrency(row.fixedPrice, row.currency),
    },
    {
      key: 'effectiveFrom',
      label: 'ساري من',
      render: (row) => formatDate(row.effectiveFrom),
    },
  ], [])

  return (
    <div>
      <PageHeader
        variant="compact"
        title="التسعير"
        description="إدارة أسعار الفئات ونسبة عمولة المنصة"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="جدول الأسعار" padding="none">
          {pricingQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={4} /></div>
          ) : pricingQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(pricingQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginatedPricing} emptyLabel="لا توجد أسعار" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <div className="space-y-loose xl:sticky xl:top-24 xl:self-start">
          <Card title="إضافة / تحديث سعر">
            <form onSubmit={handleUpsert}>
              <FormSection>
                <Input
                  label="رمز الفئة"
                  value={form.categoryCode}
                  onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
                  required
                />
                <Input
                  label="النوع الفرعي (اختياري)"
                  value={form.subTypeCode}
                  onChange={(e) => setForm((f) => ({ ...f, subTypeCode: e.target.value }))}
                />
                <Input
                  label="السعر الثابت"
                  type="number"
                  min={0}
                  value={form.fixedPrice}
                  onChange={(e) => setForm((f) => ({ ...f, fixedPrice: e.target.value }))}
                  required
                />
                <Input
                  label="العملة"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  maxLength={3}
                />
                <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
                  حفظ
                </Button>
              </FormSection>
            </form>
          </Card>

          <Card title="نسبة العمولة">
            <form onSubmit={handleCommission}>
              <FormSection>
                <Input
                  label="النسبة (0–1، مثال: 0.02 = 2%)"
                  type="number"
                  step="0.001"
                  min={0}
                  max={1}
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={commissionMutation.isPending}>
                  تحديث العمولة
                </Button>
              </FormSection>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
