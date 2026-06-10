import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent } from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatCurrency } from '@/lib/helpers/format'
import { formatDate } from '@/lib/helpers/date'
import { useToast } from '@/hooks/useToast'

export const AdminPricingPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

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

  return (
    <div>
      <PageHeader title="التسعير" description="إدارة أسعار الفئات ونسبة عمولة المنصة" />

      <div className="grid gap-loose xl:grid-cols-[1fr_340px]">
        <Card title="جدول الأسعار">
          <AsyncContent
            isLoading={pricingQuery.isLoading}
            error={pricingQuery.error}
            isEmpty={pricing.length === 0}
            emptyTitle="لا توجد أسعار"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">الفئة</th>
                    <th className="py-3 pe-4 text-start">النوع الفرعي</th>
                    <th className="py-3 pe-4 text-start">السعر</th>
                    <th className="py-3 pe-4 text-start">ساري من</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.map((row) => (
                    <tr key={row._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4">{row.categoryCode}</td>
                      <td className="py-3 pe-4">{row.subTypeCode || '—'}</td>
                      <td className="py-3 pe-4">{formatCurrency(row.fixedPrice, row.currency)}</td>
                      <td className="py-3 pe-4">{formatDate(row.effectiveFrom)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            )}
          </AsyncContent>
        </Card>

        <div className="space-y-loose">
          <Card title="إضافة / تحديث سعر">
            <form onSubmit={handleUpsert} className="space-y-4">
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
            </form>
          </Card>

          <Card title="نسبة العمولة">
            <form onSubmit={handleCommission} className="space-y-4">
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
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
