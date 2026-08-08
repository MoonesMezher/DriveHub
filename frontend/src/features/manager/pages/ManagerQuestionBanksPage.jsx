import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, Badge, LicenseCategorySelect, Select, Textarea, ImageUploadField,
} from '@/components/ui'
import { managerService, mediaService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { QuestionBankDetailPanel } from '../components/QuestionBankDetailPanel'
import { QuestionDetailPanel } from '../components/QuestionDetailPanel'

const PAGE_SIZE = 10

const QUESTION_TYPE_OPTIONS = [
  { value: 'mcq', label: 'اختيار من متعدد' },
  { value: 'true_false', label: 'صح / خطأ' },
]

const TYPE_LABELS = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح / خطأ',
}

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

const emptyQuestionForm = () => ({
  text: '',
  type: 'mcq',
  options: DEFAULT_MCQ_OPTIONS.map((o) => ({ ...o })),
  correctAnswer: 'A',
  explanation: '',
  imageUrl: '',
})

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
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [editingQuestionId, setEditingQuestionId] = useState('')
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm())
  const [uploadingImage, setUploadingImage] = useState(false)

  const banksQuery = useQuery({
    queryKey: ['manager', 'question-banks'],
    queryFn: () => managerService.listQuestionBanks().then(unwrap),
  })

  const banks = banksQuery.data?.banks ?? []

  const bankDetailQuery = useQuery({
    queryKey: ['manager', 'question-banks', selectedBankId],
    queryFn: () => managerService.getQuestionBank(selectedBankId).then(unwrap),
    enabled: Boolean(selectedBankId),
  })

  const questionDetailQuery = useQuery({
    queryKey: ['manager', 'question-banks', selectedBankId, 'questions', selectedQuestionId],
    queryFn: () => managerService.getQuestion(selectedBankId, selectedQuestionId).then(unwrap),
    enabled: Boolean(selectedBankId && selectedQuestionId),
  })

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

  const selectedFromList = useMemo(
    () => banks.find((b) => b._id === selectedBankId) || null,
    [banks, selectedBankId],
  )

  const selectedBank = bankDetailQuery.data?.bank || selectedFromList
  const isSystemBank = Boolean(selectedBank?.isSystem)
  const bankQuestions = selectedBank?.questions ?? []

  const selectedQuestionFromList = useMemo(
    () => bankQuestions.find((q) => String(q._id) === String(selectedQuestionId)) || null,
    [bankQuestions, selectedQuestionId],
  )

  const selectedQuestion = questionDetailQuery.data?.question || selectedQuestionFromList
  const questionBankMeta = questionDetailQuery.data?.bank || selectedBank

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
      setQuestionForm(emptyQuestionForm())
      setEditingQuestionId('')
      queryClient.invalidateQueries({ queryKey: ['manager', 'question-banks'] })
    },
    onError: (err) => toast.error(err, 'فشل إضافة السؤال'),
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ bankId, questionId, data }) =>
      managerService.updateQuestion(bankId, questionId, data).then(unwrap),
    onSuccess: () => {
      toast.success('تم تحديث السؤال')
      setQuestionForm(emptyQuestionForm())
      setEditingQuestionId('')
      queryClient.invalidateQueries({ queryKey: ['manager', 'question-banks'] })
    },
    onError: (err) => toast.error(err, 'فشل تحديث السؤال'),
  })

  const bankOptions = banks.map((b) => ({
    value: b._id,
    label: `${b.isSystem ? '[نظام] ' : ''}${b.title} — ${b.categoryCode} (${b.questions?.length ?? 0} سؤال)`,
  }))

  const questionPickOptions = bankQuestions.map((q) => ({
    value: q._id,
    label: q.text?.length > 70 ? `${q.text.slice(0, 70)}…` : (q.text || q._id),
  }))

  const answerOptions = (questionForm.type === 'true_false'
    ? TRUE_FALSE_OPTIONS
    : questionForm.options
  ).filter((o) => o.text.trim()).map((o) => ({ value: o.key, label: `${o.key}: ${o.text}` }))

  const handleQuestionTypeChange = (type) => {
    setQuestionForm((f) => ({
      ...f,
      type,
      options: type === 'true_false' ? TRUE_FALSE_OPTIONS : DEFAULT_MCQ_OPTIONS.map((o) => ({ ...o })),
      correctAnswer: type === 'true_false' ? 'true' : 'A',
    }))
  }

  const loadQuestionForEdit = (questionId) => {
    setEditingQuestionId(questionId)
    if (!questionId) {
      setQuestionForm(emptyQuestionForm())
      return
    }
    const q = bankQuestions.find((item) => item._id === questionId)
    if (!q) {
      setQuestionForm(emptyQuestionForm())
      return
    }
    const type = q.type === 'true_false' ? 'true_false' : 'mcq'
    setQuestionForm({
      text: q.text || '',
      type,
      options: type === 'true_false'
        ? TRUE_FALSE_OPTIONS
        : (q.options?.length
          ? q.options.map((o) => ({ key: o.key, text: o.text || '' }))
          : DEFAULT_MCQ_OPTIONS.map((o) => ({ ...o }))),
      correctAnswer: q.correctAnswer || (type === 'true_false' ? 'true' : 'A'),
      explanation: q.explanation || '',
      imageUrl: q.imageUrl || '',
    })
  }

  const buildQuestionPayload = () => {
    const options = questionForm.type === 'true_false'
      ? TRUE_FALSE_OPTIONS
      : questionForm.options.filter((o) => o.text.trim())
    if (!questionForm.text.trim()) {
      toast.error('نص السؤال مطلوب')
      return null
    }
    if (options.length < 2) {
      toast.error('أدخل خيارين على الأقل')
      return null
    }
    return {
      text: questionForm.text.trim(),
      type: questionForm.type,
      options,
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation.trim() || undefined,
      imageUrl: questionForm.imageUrl || undefined,
    }
  }

  const handleSaveQuestion = (e) => {
    e.preventDefault()
    if (!selectedBankId) {
      toast.error('اختر بنك الأسئلة أولاً')
      return
    }
    if (isSystemBank) {
      toast.error('بنك النظام للعرض فقط — عدّل أسئلة مدرستك أو راجع طلبات تعديل المدرب')
      return
    }
    const data = buildQuestionPayload()
    if (!data) return

    if (editingQuestionId) {
      updateQuestionMutation.mutate({ bankId: selectedBankId, questionId: editingQuestionId, data })
      return
    }
    addQuestionMutation.mutate({ bankId: selectedBankId, data })
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

  const selectBank = (bank) => {
    if (selectedBankId === bank._id) {
      setSelectedBankId('')
      setSelectedQuestionId(null)
      return
    }
    setSelectedBankId(bank._id)
    setSelectedQuestionId(null)
    setEditingQuestionId('')
    setQuestionForm(emptyQuestionForm())
  }

  const toggleQuestion = (question) => {
    setSelectedQuestionId((current) => (current === question._id ? null : question._id))
  }

  const columns = [
    {
      key: 'name',
      label: 'الاسم',
      render: (bank) => (
        <span>
          {bank.title || '—'}
          {bank.isSystem ? (
            <Badge variant="primary" className="ms-2">نظام</Badge>
          ) : null}
        </span>
      ),
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
          {bank.isSystem ? 'نظام كامل' : bank.status === 'active' ? 'نشط' : bank.status}
        </Badge>
      ),
    },
  ]

  const questionColumns = [
    {
      key: 'text',
      label: 'السؤال',
      render: (q) => (q.text?.length > 80 ? `${q.text.slice(0, 80)}…` : (q.text || '—')),
    },
    {
      key: 'type',
      label: 'النوع',
      render: (q) => TYPE_LABELS[q.type] || q.type || '—',
    },
    {
      key: 'image',
      label: 'صورة',
      render: (q) => (q.imageUrl ? 'نعم' : '—'),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (q) => (
        <Badge variant={q.status !== 'archived' ? 'success' : 'default'}>
          {q.status === 'archived' ? 'مؤرشف' : 'نشط'}
        </Badge>
      ),
    },
  ]

  const saving = addQuestionMutation.isPending || updateQuestionMutation.isPending

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="بنوك الأسئلة"
        description="عرض بنك النظام وبنوك المدرسة — اضغط على بنك أو سؤال لعرض التفاصيل الكاملة"
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالاسم أو الفئة..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <div className="space-y-comfortable">
          <Card title="البنوك الحالية (نظام + مدرسة)" padding="none">
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
                  onRowClick={selectBank}
                  rowClassName={(bank) =>
                    bank._id === selectedBankId
                      ? 'bg-primary-container/30 hover:bg-primary-container/40'
                      : undefined
                  }
                />
                <div className="border-t border-outline-variant/50 p-comfortable">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
                {selectedBankId && bankDetailQuery.isError && !selectedFromList && (
                  <div className="p-comfortable">
                    <Alert variant="error" title="تعذر تحميل تفاصيل البنك">
                      {getErrorMessage(bankDetailQuery.error)}
                    </Alert>
                  </div>
                )}
                {selectedBank && (
                  <QuestionBankDetailPanel
                    bank={selectedBank}
                    loading={bankDetailQuery.isLoading && !selectedFromList}
                    onClose={() => {
                      setSelectedBankId('')
                      setSelectedQuestionId(null)
                    }}
                  />
                )}
              </>
            )}
          </Card>

          {selectedBankId && (
            <Card title="أسئلة البنك المحدد" padding="none">
              <DataTable
                columns={questionColumns}
                rows={bankQuestions}
                emptyLabel="لا توجد أسئلة في هذا البنك"
                emptyPreset="no-data"
                onRowClick={toggleQuestion}
                rowClassName={(q) =>
                  String(q._id) === String(selectedQuestionId)
                    ? 'bg-primary-container/30 hover:bg-primary-container/40'
                    : undefined
                }
              />
              {selectedQuestionId && questionDetailQuery.isError && !selectedQuestionFromList && (
                <div className="p-comfortable">
                  <Alert variant="error" title="تعذر تحميل تفاصيل السؤال">
                    {getErrorMessage(questionDetailQuery.error)}
                  </Alert>
                </div>
              )}
              {selectedQuestion && (
                <QuestionDetailPanel
                  question={selectedQuestion}
                  bank={questionBankMeta}
                  loading={questionDetailQuery.isLoading && !selectedQuestionFromList}
                  onClose={() => setSelectedQuestionId(null)}
                />
              )}
            </Card>
          )}
        </div>

        <Card title="بنك جديد" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleCreate}>
            <FormSection description="أنشئ بنكاً خاصاً بمدرستك بجانب بنك النظام">
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
            <form onSubmit={handleSaveQuestion}>
              <FormSection
                title={editingQuestionId ? 'تعديل سؤال' : 'إضافة سؤال'}
                description={
                  selectedBank
                    ? `${isSystemBank ? 'عرض بنك النظام — ' : ''}${selectedBank.title}`
                    : 'اختر بنكاً من الجدول'
                }
              >
                <Select
                  label="بنك الأسئلة"
                  value={selectedBankId}
                  onChange={(e) => {
                    setSelectedBankId(e.target.value)
                    setSelectedQuestionId(null)
                    setEditingQuestionId('')
                    setQuestionForm(emptyQuestionForm())
                  }}
                  options={bankOptions}
                  placeholder="اختر البنك"
                />
                {selectedBankId && !isSystemBank && (
                  <Select
                    label="تعديل سؤال موجود (اختياري)"
                    value={editingQuestionId}
                    onChange={(e) => loadQuestionForEdit(e.target.value)}
                    options={questionPickOptions}
                    placeholder="— سؤال جديد —"
                  />
                )}
                {isSystemBank && (
                  <Alert variant="info" title="بنك النظام">
                    يظهر هنا كامل أسئلة النظام للعرض. لإضافة أو تعديل أسئلة المدرسة اختر بنكاً غير معلّم بـ «نظام».
                  </Alert>
                )}
                <Textarea
                  label="نص السؤال"
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, text: e.target.value }))}
                  rows={3}
                  required
                  disabled={isSystemBank}
                />
                <Select
                  label="نوع السؤال"
                  value={questionForm.type}
                  onChange={(e) => handleQuestionTypeChange(e.target.value)}
                  options={QUESTION_TYPE_OPTIONS}
                  disabled={isSystemBank}
                />
                {questionForm.type === 'mcq' && questionForm.options.map((opt, idx) => (
                  <Input
                    key={opt.key}
                    label={`الخيار ${opt.key}`}
                    value={opt.text}
                    disabled={isSystemBank}
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
                  disabled={isSystemBank}
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
                  disabled={isSystemBank}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={saving || !selectedBankId || isSystemBank}
                  >
                    {editingQuestionId
                      ? (updateQuestionMutation.isPending ? 'جاري الحفظ…' : 'حفظ التعديل')
                      : (addQuestionMutation.isPending ? 'جاري الإضافة…' : 'إضافة السؤال')}
                  </Button>
                  {editingQuestionId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingQuestionId('')
                        setQuestionForm(emptyQuestionForm())
                      }}
                    >
                      إلغاء
                    </Button>
                  )}
                </div>
              </FormSection>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
