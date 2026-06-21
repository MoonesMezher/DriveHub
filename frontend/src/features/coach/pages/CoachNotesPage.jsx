import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Button, Input, Badge, Tabs, Textarea } from '@/components/ui'
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
    proposedChanges: '',
  })

  const notesQuery = useQuery({
    queryKey: ['coach', 'notes'],
    queryFn: async () => unwrap(await coachService.listNotes()),
  })

  const studentsQuery = useQuery({
    queryKey: ['coach', 'students'],
    queryFn: async () => unwrap(await coachService.students()),
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
      setContentEditForm({ contentId: '', contentType: 'theory', proposedChanges: '' })
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
    let proposedChanges
    try {
      proposedChanges = JSON.parse(contentEditForm.proposedChanges)
    } catch {
      toast.error('صيغة JSON غير صالحة')
      return
    }
    contentEditMutation.mutate({
      contentId: contentEditForm.contentId,
      contentType: contentEditForm.contentType,
      proposedChanges,
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
              <Input
                label="معرّف بنك الأسئلة"
                value={questionEditForm.questionBankId}
                onChange={(e) => setQuestionEditForm((f) => ({ ...f, questionBankId: e.target.value }))}
                required
              />
              <Input
                label="معرّف السؤال"
                value={questionEditForm.questionId}
                onChange={(e) => setQuestionEditForm((f) => ({ ...f, questionId: e.target.value }))}
                required
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
              <Input
                label="معرّف المحتوى"
                value={contentEditForm.contentId}
                onChange={(e) => setContentEditForm((f) => ({ ...f, contentId: e.target.value }))}
                required
              />
              <div className="space-y-2">
                <label htmlFor="contentType" className="block text-label-md text-on-surface">
                  نوع المحتوى
                </label>
                <select
                  id="contentType"
                  value={contentEditForm.contentType}
                  onChange={(e) => setContentEditForm((f) => ({ ...f, contentType: e.target.value }))}
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
                  required
                >
                  <option value="theory">نظري</option>
                  <option value="shared">مشترك</option>
                  <option value="specific">خاص</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="التعديلات المقترحة (JSON)"
                  value={contentEditForm.proposedChanges}
                  onChange={(e) => setContentEditForm((f) => ({ ...f, proposedChanges: e.target.value }))}
                  placeholder='{"title": "عنوان محدّث"}'
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
