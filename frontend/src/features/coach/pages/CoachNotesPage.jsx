import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, AsyncContent, Card, Button, Input, Badge } from '@/components/ui'
import { coachService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'

export const CoachNotesPage = () => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    studentId: '',
    schoolId: '',
    personalNotes: '',
    lessonRating: '',
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
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const notes = notesQuery.data?.notes ?? []
  const students = studentsQuery.data?.students ?? []

  const handleStudentChange = (studentId) => {
    setForm((f) => ({ ...f, studentId }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.studentId || !form.schoolId) {
      toast.error('يرجى اختيار الطالب وإدخال معرّف المدرسة')
      return
    }
    addMutation.mutate({
      studentId: form.studentId,
      schoolId: form.schoolId,
      personalNotes: form.personalNotes || undefined,
      lessonRating: form.lessonRating ? Number(form.lessonRating) : undefined,
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="الملاحظات"
        description="سجّل ملاحظاتك الشخصية عن الطلاب"
      />

      <Card title="إضافة ملاحظة" className="mb-loose">
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
          <Input
            label="معرّف المدرسة"
            name="schoolId"
            value={form.schoolId}
            onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
            required
            hint="معرّف مدرسة القيادة"
          />
          <div className="md:col-span-2">
            <Input
              label="الملاحظات"
              name="personalNotes"
              value={form.personalNotes}
              onChange={(e) => setForm((f) => ({ ...f, personalNotes: e.target.value }))}
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

      <AsyncContent
        isLoading={notesQuery.isLoading}
        error={notesQuery.error}
        isEmpty={!notes.length}
        emptyIcon="edit_note"
        emptyTitle="لا توجد ملاحظات"
        emptyDescription="أضف ملاحظة عن أحد طلابك"
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
    </div>
  )
}
