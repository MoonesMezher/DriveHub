import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, Badge,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

const PAGE_SIZE = 10

export const ManagerQuestionBanksPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({
    categoryCode: '',
    subTypeCode: '',
    name: '',
  })

  const banksQuery = useQuery({
    queryKey: ['manager', 'question-banks'],
    queryFn: () => managerService.listQuestionBanks().then(unwrap),
  })

  const banks = banksQuery.data?.banks ?? []

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return banks
    return banks.filter(
      (b) =>
        b.name?.toLowerCase().includes(q)
        || b.categoryCode?.toLowerCase().includes(q)
        || b.subTypeCode?.toLowerCase().includes(q),
    )
  }, [banks, search])

  const totalPages = Math.max(1, Math.ceil(filteredBanks.length / PAGE_SIZE))
  const paginatedBanks = filteredBanks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const createMutation = useMutation({
    mutationFn: (data) => managerService.createQuestionBank(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إنشاء بنك الأسئلة')
      setForm({ categoryCode: '', subTypeCode: '', name: '' })
      queryClient.invalidateQueries({ queryKey: ['manager', 'question-banks'] })
    },
    onError: (err) => toast.error(err, 'فشل إنشاء بنك الأسئلة'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    createMutation.mutate({
      schoolId,
      categoryCode: form.categoryCode.trim().toUpperCase(),
      subTypeCode: form.subTypeCode.trim() || undefined,
      name: form.name.trim() || undefined,
    })
  }

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      render: (bank) => bank.name || '—',
    },
    {
      key: 'category',
      label: 'الفئة',
      render: (bank) =>
        `${bank.categoryCode}${bank.subTypeCode ? ` (${bank.subTypeCode})` : ''}`,
    },
    {
      key: 'count',
      label: 'عدد الأسئلة',
      render: (bank) => bank.questions?.length ?? 0,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (bank) => (
        <Badge variant={bank.status === 'active' ? 'success' : 'default'}>
          {bank.status === 'active' ? 'نشط' : bank.status}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="بنوك الأسئلة"
        description="إدارة أسئلة الاختبارات النظرية للمدرسة"
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالاسم أو الفئة..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="البنوك الحالية" padding="none">
          {banksQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={4} /></div>
          ) : banksQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(banksQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={paginatedBanks}
                emptyLabel="لا توجد بنوك أسئلة"
                emptyPreset="no-data"
              />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>

        <Card title="بنك جديد" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleCreate}>
            <FormSection description="أنشئ بنكاً جديداً لبدء إضافة الأسئلة">
              <Input
                label="رمز الفئة"
                name="categoryCode"
                value={form.categoryCode}
                onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
                placeholder="مثال: B"
                required
              />
              <Input
                label="النوع الفرعي (اختياري)"
                name="subTypeCode"
                value={form.subTypeCode}
                onChange={(e) => setForm((f) => ({ ...f, subTypeCode: e.target.value }))}
              />
              <Input
                label="اسم البنك (اختياري)"
                name="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                إنشاء البنك
              </Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
