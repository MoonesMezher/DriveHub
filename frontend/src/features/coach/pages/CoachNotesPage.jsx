import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Button, Input, Badge, Tabs, Textarea, Select } from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useAuth } from '@/hooks/useAuth'

const NOTE_TABS = [
  { id: 'add', label: 'إضافة ملاحظة' },
  { id: 'list', label: 'القائمة' },
  { id: 'edits', label: 'طلبات التعديل' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: 'theory', label: 'نظري' },
  { value: 'shared', label: 'مشترك' },
  { value: 'specific', label: 'خاص' },
  { value: 'video', label: 'فيديو عملي' },
]

const CONTENT_FIELD_OPTIONS = {
  theory: [
    { value: 'title', label: 'العنوان' },
    { value: 'body', label: 'المحتوى' },
  ],
  shared: [
    { value: 'title', label: 'العنوان' },
    { value: 'body', label: 'المحتوى' },
  ],
  specific: [
    { value: 'title', label: 'العنوان' },
    { value: 'body', label: 'المحتوى' },
  ],
  video: [
    { value: 'title', label: 'العنوان' },
    { value: 'url', label: 'رابط الفيديو' },
  ],
}

const QUESTION_FIELD_OPTIONS = [
  { value: 'text', label: 'نص السؤال' },
  { value: 'explanation', label: 'التفسير' },
]

const contentItemLabel = (item) => {
  const parts = [item.title]
  if (item.categoryCode) parts.push(`فئة ${item.categoryCode}`)
  if (item.section) parts.push(item.section)
  if (item.phase != null) parts.push(`مرحلة ${item.phase}`)
  return parts.filter(Boolean).join(' — ')
}

export const CoachNotesPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const coachSchoolId = user?.activeContext?.schoolId || ''
  const [activeTab, setActiveTab] = useState('add')
  const [form, setForm] = useState({
    studentId: '',
    schoolId: '',
    personalNotes: '',
    lessonRating: '',
  })
  const [questionEditForm, setQuestionEditForm] = useState({
    questionBankId: '',
    questionId: '',
    field: 'text',
    newValue: '',
  })
  const [contentEditForm, setContentEditForm] = useState({
    contentId: '',
    contentType: 'theory',
    field: 'title',
    newValue: '',
  })

  const notesQuery = useQuery({
    queryKey: ['coach', 'notes'],
    queryFn: async () => unwrap(await coachService.listNotes()),
  })

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: async () => unwrap(await coachService.students()),
  })

  const questionBanksQuery = useQuery({
    queryKey: ['coach', 'question-banks'],
    queryFn: async () => unwrap(await coachService.listQuestionBanks()),
    enabled: activeTab === 'edits',
  })

  const contentQuery = useQuery({
    queryKey: ['coach', 'content', contentEditForm.contentType],
    queryFn: async () => unwrap(await coachService.listContent(contentEditForm.contentType)),
    enabled: activeTab === 'edits',
  })

  const addMutation = useMutation({
    mutationFn: (data) => coachService.addNote(data),
    onSuccess: () => {
      toast.success('تمت إضافة الملاحظة')
      setForm({ studentId: '', schoolId: '', personalNotes: '', lessonRating: '' })
      queryClient.invalidateQueries({ queryKey: ['coach', 'notes'] })
      setActiveTab('list')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const contentEditMutation = useMutation({
    mutationFn: (data) => coachService.requestContentEdit(data),
    onSuccess: () => {
      toast.success('تم إرسال طلب تعديل المحتوى للمدير')
      setContentEditForm({ contentId: '', contentType: 'theory', field: 'title', newValue: '' })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const questionEditMutation = useMutation({
    mutationFn: (data) => coachService.requestQuestionEdit(data),
    onSuccess: () => {
      toast.success('تم إرسال طلب تعديل السؤال للمدير')
      setQuestionEditForm({ questionBankId: '', questionId: '', field: 'text', newValue: '' })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const notes = notesQuery.data?.notes ?? []
  const students = studentsQuery.data?.students ?? []
  const questionBanks = questionBanksQuery.data?.banks ?? []
  const contentItems = contentQuery.data?.items ?? []

  const selectedBank = questionBanks.find((b) => b._id === questionEditForm.questionBankId)
  const bankQuestions = selectedBank?.questions ?? []

  const questionBankOptions = questionBanks.map((bank) => ({
    value: bank._id,
    label: `${bank.title} — ${bank.categoryCode}${bank.subTypeCode ? ` (${bank.subTypeCode})` : ''}`,
  }))

  const questionOptions = bankQuestions.map((q) => ({
    value: q._id,
    label: q.text?.length > 80 ? `${q.text.slice(0, 80)}…` : (q.text || q._id),
  }))

  const contentOptions = contentItems.map((item) => ({
    value: item._id,
    label: contentItemLabel(item),
  }))

  const handleStudentChange = (studentId) => {
    setForm((f) => ({
      ...f,
      studentId,
      schoolId: coachSchoolId,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.studentId || !coachSchoolId) {
      toast.error('يرجى اختيار الطالب')
      return
    }
    addMutation.mutate({
      studentId: form.studentId,
      schoolId: coachSchoolId,
      personalNotes: form.personalNotes || undefined,
      lessonRating: form.lessonRating ? Number(form.lessonRating) : undefined,
    })
  }

  const handleContentEditSubmit = (e) => {
    e.preventDefault()
    if (!contentEditForm.contentId || !contentEditForm.newValue.trim()) {
      toast.error('أكمل حقول طلب التعديل')
      return
    }
    contentEditMutation.mutate({
      contentId: contentEditForm.contentId,
      contentType: contentEditForm.contentType,
      proposedChanges: { [contentEditForm.field]: contentEditForm.newValue.trim() },
    })
  }

  const handleQuestionEditSubmit = (e) => {
    e.preventDefault()
    if (!questionEditForm.questionBankId || !questionEditForm.questionId || !questionEditForm.newValue.trim()) {
      toast.error('أكمل حقول طلب التعديل')
      return
    }
    questionEditMutation.mutate({
      questionBankId: questionEditForm.questionBankId,
      questionId: questionEditForm.questionId,
      proposedChanges: { [questionEditForm.field]: questionEditForm.newValue.trim() },
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="الملاحظات"
        description="سجّل ملاحظاتك الشخصية عن الطلاب واطلب تعديلات المحتوى"
      />

      <Tabs tabs={NOTE_TABS} activeId={activeTab} onChange={setActiveTab} className="mb-loose" />

      {activeTab === 'add' && (
        <Card title="إضافة ملاحظة">
          <form onSubmit={handleSubmit} className="grid gap-comfortable md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="studentId" className="block text-label-md text-on-surface">
                الطالب
              </label>
              <select
                id="studentId"
                value={form.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
                required
              >
                <option value="">اختر طالباً</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-body-md text-on-surface-variant">
              المدرسة: {user?.activeContext?.schoolName || 'مدرسة المدرب الحالية'}
            </p>
            <div className="md:col-span-2">
              <Textarea
                label="الملاحظات"
                name="personalNotes"
                value={form.personalNotes}
                onChange={(e) => setForm((f) => ({ ...f, personalNotes: e.target.value }))}
                placeholder="ملاحظاتك عن أداء الطالب..."
              />
            </div>
            <Input
              label="تقييم الدرس (1–5)"
              name="lessonRating"
              type="number"
              min={1}
              max={5}
              value={form.lessonRating}
              onChange={(e) => setForm((f) => ({ ...f, lessonRating: e.target.value }))}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'جاري الحفظ…' : 'حفظ الملاحظة'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'list' && (
        <AsyncContent
          isLoading={notesQuery.isLoading}
          error={notesQuery.error}
          isEmpty={!notes.length}
          emptyIcon="edit_note"
          emptyTitle="لا توجد ملاحظات"
          emptyDescription="أضف ملاحظة عن أحد طلابك"
          emptyAction={{ label: 'إضافة ملاحظة', onClick: () => setActiveTab('add') }}
        >
          {() => (
          <div className="space-y-comfortable">
            {notes.map((note) => (
              <Card key={note._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-headline-sm text-on-surface">
                      {note.studentId?.name ?? 'طالب'}
                    </p>
                    {note.personalNotes && (
                      <p className="mt-2 text-body-md text-on-surface-variant">{note.personalNotes}</p>
                    )}
                    <p className="mt-2 text-label-sm text-on-surface-variant">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                  {note.lessonRating != null && (
                    <Badge variant="secondary">تقييم {note.lessonRating}/5</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
          )}
        </AsyncContent>
      )}

      {activeTab === 'edits' && (
        <div className="space-y-loose">
          <Card title="طلب تعديل سؤال">
            <form onSubmit={handleQuestionEditSubmit} className="grid gap-comfortable md:grid-cols-2">
              <Select
                label="بنك الأسئلة"
                value={questionEditForm.questionBankId}
                onChange={(e) =>
                  setQuestionEditForm((f) => ({
                    ...f,
                    questionBankId: e.target.value,
                    questionId: '',
                  }))
                }
                placeholder="— اختر بنكاً —"
                options={questionBankOptions}
                required
              />
              <Select
                label="السؤال"
                value={questionEditForm.questionId}
                onChange={(e) => setQuestionEditForm((f) => ({ ...f, questionId: e.target.value }))}
                placeholder={questionEditForm.questionBankId ? '— اختر سؤالاً —' : 'اختر بنكاً أولاً'}
                options={questionOptions}
                disabled={!questionEditForm.questionBankId}
                required
              />
              <Select
                label="الحقل المراد تعديله"
                value={questionEditForm.field}
                onChange={(e) => setQuestionEditForm((f) => ({ ...f, field: e.target.value }))}
                options={QUESTION_FIELD_OPTIONS}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="القيمة الجديدة"
                  value={questionEditForm.newValue}
                  onChange={(e) => setQuestionEditForm((f) => ({ ...f, newValue: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={questionEditMutation.isPending}>
                  {questionEditMutation.isPending ? 'جاري الإرسال…' : 'إرسال للموافقة'}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="طلب تعديل محتوى">
            <form onSubmit={handleContentEditSubmit} className="grid gap-comfortable md:grid-cols-2">
              <Select
                label="نوع المحتوى"
                value={contentEditForm.contentType}
                onChange={(e) =>
                  setContentEditForm((f) => ({
                    ...f,
                    contentType: e.target.value,
                    contentId: '',
                    field: 'title',
                  }))
                }
                options={CONTENT_TYPE_OPTIONS}
                required
              />
              <Select
                label="المحتوى"
                value={contentEditForm.contentId}
                onChange={(e) => setContentEditForm((f) => ({ ...f, contentId: e.target.value }))}
                placeholder="— اختر محتوى —"
                options={contentOptions}
                required
              />
              <Select
                label="الحقل المراد تعديله"
                value={contentEditForm.field}
                onChange={(e) => setContentEditForm((f) => ({ ...f, field: e.target.value }))}
                options={CONTENT_FIELD_OPTIONS[contentEditForm.contentType] || []}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="القيمة الجديدة"
                  value={contentEditForm.newValue}
                  onChange={(e) => setContentEditForm((f) => ({ ...f, newValue: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={contentEditMutation.isPending}>
                  {contentEditMutation.isPending ? 'جاري الإرسال…' : 'إرسال طلب التعديل'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
