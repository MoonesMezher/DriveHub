import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, Badge,   LicenseCategorySelect, Select, Textarea, ImageUploadField,
} from '@/components/ui'
import { managerService, mediaService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

const PAGE_SIZE = 10

const QUESTION_TYPE_OPTIONS = [
  { value: 'mcq', label: 'اختيار من متعدد' },
  { value: 'true_false', label: 'صح / خطأ' },
]

const DEFAULT_MCQ_OPTIONS = [
  { key: 'A', text: '' },
  { key: 'B', text: '' },
  { key: 'C', text: '' },
  { key: 'D', text: '' },
]

const TRUE_FALSE_OPTIONS = [
  { key: 'true', text: 'صح' },
  { key: 'false', text: 'خطأ' },
]

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
    title: '',
  })
  const [selectedBankId, setSelectedBankId] = useState('')
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'mcq',
    options: DEFAULT_MCQ_OPTIONS,
    correctAnswer: 'A',
    explanation: '',
    imageUrl: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)

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
        b.title?.toLowerCase().includes(q)
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
      setForm({ categoryCode: '', subTypeCode: '', title: '' })
      queryClient.invalidateQueries({ queryKey: ['manager', 'question-banks'] })
    },
    onError: (err) => toast.error(err, 'فشل إنشاء بنك الأسئلة'),
  })

  const addQuestionMutation = useMutation({
    mutationFn: ({ bankId, data }) => managerService.addQuestion(bankId, data).then(unwrap),
    onSuccess: () => {
      toast.success('تمت إضافة السؤال')
      setQuestionForm({
        text: '',
        type: 'mcq',
        options: DEFAULT_MCQ_OPTIONS,
        correctAnswer: 'A',
        explanation: '',
        imageUrl: '',
      })
      queryClient.invalidateQueries({ queryKey: ['manager', 'question-banks'] })
    },
    onError: (err) => toast.error(err, 'فشل إضافة السؤال'),
  })

  const selectedBank = banks.find((b) => b._id === selectedBankId)
  const bankOptions = banks.map((b) => ({
    value: b._id,
    label: `${b.title} — ${b.categoryCode} (${b.questions?.length ?? 0} سؤال)`,
  }))
  const answerOptions = (questionForm.type === 'true_false'
    ? TRUE_FALSE_OPTIONS
    : questionForm.options
  ).filter((o) => o.text.trim()).map((o) => ({ value: o.key, label: `${o.key}: ${o.text}` }))

  const handleQuestionTypeChange = (type) => {
    setQuestionForm((f) => ({
      ...f,
      type,
      options: type === 'true_false' ? TRUE_FALSE_OPTIONS : DEFAULT_MCQ_OPTIONS,
      correctAnswer: type === 'true_false' ? 'true' : 'A',
    }))
  }

  const handleAddQuestion = (e) => {
    e.preventDefault()
    if (!selectedBankId) {
      toast.error('اختر بنك الأسئلة أولاً')
      return
    }
    if (!questionForm.text.trim()) {
      toast.error('نص السؤال مطلوب')
      return
    }
    const options = questionForm.type === 'true_false'
      ? TRUE_FALSE_OPTIONS
      : questionForm.options.filter((o) => o.text.trim())
    if (options.length < 2) {
      toast.error('أدخل خيارين على الأقل')
      return
    }
    addQuestionMutation.mutate({
      bankId: selectedBankId,
      data: {
        text: questionForm.text.trim(),
        type: questionForm.type,
        options,
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation.trim() || undefined,
        imageUrl: questionForm.imageUrl || undefined,
      },
    })
  }

  const handleImageUpload = async (file) => {
    setUploadingImage(true)
    try {
      const result = await mediaService.upload(file, { category: 'question' })
      setQuestionForm((f) => ({ ...f, imageUrl: result.media.url }))
      toast.success('تم رفع صورة السؤال')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('اسم البنك مطلوب')
      return
    }
    createMutation.mutate({
      schoolId,
      categoryCode: form.categoryCode.trim().toUpperCase(),
      subTypeCode: form.subTypeCode.trim() || undefined,
      title: form.title.trim(),
    })
  }

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      render: (bank) => bank.title || '—',
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
                onRowClick={(bank) => setSelectedBankId(bank._id)}
                rowClassName={(bank) =>
                  bank._id === selectedBankId ? 'bg-primary-container/30' : undefined
                }
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
                label="اسم البنك"
                name="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثال: أسئلة الفئة B"
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
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                إنشاء البنك
              </Button>
            </FormSection>
          </form>

          <div className="mt-loose border-t border-outline-variant/50 pt-loose">
            <form onSubmit={handleAddQuestion}>
              <FormSection
                title="إضافة سؤال"
                description={selectedBank ? `إلى: ${selectedBank.title}` : 'اختر بنكاً من الجدول'}
              >
                <Select
                  label="بنك الأسئلة"
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  options={bankOptions}
                  placeholder="اختر البنك"
                />
                <Textarea
                  label="نص السؤال"
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, text: e.target.value }))}
                  rows={3}
                  required
                />
                <Select
                  label="نوع السؤال"
                  value={questionForm.type}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  options={QUESTION_TYPE_OPTIONS}
                />
                {questionForm.type === 'mcq' && questionForm.options.map((opt, idx) => (
                  <Input
                    key={opt.key}
                    label={`الخيار ${opt.key}`}
                    value={opt.text}
                    onChange={(e) => {
                      const options = [...questionForm.options]
                      options[idx] = { ...options[idx], text: e.target.value }
                      setQuestionForm((f) => ({ ...f, options }))
                    }}
                  />
                ))}
                <Select
                  label="الإجابة الصحيحة"
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, correctAnswer: e.target.value }))}
                  options={answerOptions.length ? answerOptions : [{ value: 'A', label: 'A' }]}
                />
                <ImageUploadField
                  label="صورة السؤال (اختياري)"
                  value={questionForm.imageUrl}
                  onUpload={handleImageUpload}
                  uploading={uploadingImage}
                  category="question"
                />
                <Textarea
                  label="التفسير (اختياري)"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={2}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addQuestionMutation.isPending || !selectedBankId}
                >
                  إضافة السؤال
                </Button>
              </FormSection>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
