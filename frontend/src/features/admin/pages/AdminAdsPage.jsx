import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, Select, Badge,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { toast } from 'sonner'

const PAGE_SIZE = 8

const PLACEMENTS = [
  { value: 'home', label: 'الرئيسية' },
  { value: 'student', label: 'بوابة الطالب' },
  { value: 'sidebar', label: 'الشريط الجانبي' },
  { value: 'banner', label: 'بانر' },
]

const emptyForm = {
  title: '',
  imageUrl: '',
  link: '',
  placement: 'home',
  status: 'active',
  startDate: '',
  endDate: '',
  order: 0,
}

export const AdminAdsPage = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(emptyForm)

  const adsQuery = useQuery({
    queryKey: ['admin', 'ads'],
    queryFn: async () => unwrap(await adminService.listAds()),
  })

  const createAd = useMutation({
    mutationFn: (data) => adminService.createAd(data),
    onSuccess: () => {
      toast.success('تم إنشاء الإعلان')
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['admin', 'ads'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const ads = adsQuery.data?.ads ?? []
  const totalPages = Math.max(1, Math.ceil(ads.length / PAGE_SIZE))
  const paginatedAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = (e) => {
    e.preventDefault()
    createAd.mutate({
      ...form,
      order: Number(form.order) || 0,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    })
  }

  const columns = useMemo(() => [
    {
      key: 'title',
      label: 'العنوان',
      render: (ad) => <span className="font-medium">{ad.title}</span>,
    },
    {
      key: 'placement',
      label: 'الموضع',
      render: (ad) => PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (ad) => (
        <Badge variant={ad.status === 'active' ? 'success' : 'default'}>{ad.status}</Badge>
      ),
    },
    {
      key: 'link',
      label: 'الرابط',
      render: (ad) =>
        ad.link ? (
          <a href={ad.link} className="text-primary underline" target="_blank" rel="noreferrer">
            {ad.link}
          </a>
        ) : '—',
    },
  ], [])

  return (
    <div>
      <PageHeader
        variant="compact"
        title="إدارة الإعلانات"
        description="إنشاء وعرض إعلانات المنصة"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="الإعلانات الحالية" padding="none">
          {adsQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={4} cols={4} /></div>
          ) : adsQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(adsQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable columns={columns} rows={paginatedAds} emptyLabel="لا إعلانات" />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card title="إعلان جديد" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleSubmit}>
            <FormSection>
              <Input label="العنوان" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input label="رابط الصورة" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              <Input label="رابط الإعلان" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              <Select
                label="الموضع"
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
                options={PLACEMENTS}
              />
              <Input label="ترتيب العرض" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              <div className="grid gap-comfortable sm:grid-cols-2">
                <Input label="تاريخ البداية" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <Input label="تاريخ النهاية" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <Button type="submit" disabled={createAd.isPending}>إنشاء إعلان</Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
