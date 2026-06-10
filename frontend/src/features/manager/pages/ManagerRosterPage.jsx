import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent } from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

const parseIds = (value) =>
  value
    .split(/[\n,]+/)
    .map((id) => id.trim())
    .filter(Boolean)

export const ManagerRosterPage = () => {
  const toast = useToast()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [form, setForm] = useState({ courseId: '', studentIds: '', enrollmentIds: '' })
  const [createdRoster, setCreatedRoster] = useState(null)
  const [submitId, setSubmitId] = useState('')

  const coursesQuery = useQuery({
    queryKey: ['manager', 'courses'],
    queryFn: () => managerService.listCourses().then(unwrap),
  })

  const courses = coursesQuery.data?.courses ?? []

  const createMutation = useMutation({
    mutationFn: (data) => managerService.createRoster(data).then(unwrap),
    onSuccess: (data) => {
      const roster = data?.roster ?? data
      toast.success('تم إنشاء القائمة')
      setCreatedRoster(roster)
      if (roster?._id) setSubmitId(roster._id)
      setForm({ courseId: '', studentIds: '', enrollmentIds: '' })
    },
    onError: (err) => toast.error(err, 'فشل إنشاء القائمة'),
  })

  const submitMutation = useMutation({
    mutationFn: (id) => managerService.submitRoster(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم إرسال القائمة إلى المرور')
      setCreatedRoster(null)
      setSubmitId('')
    },
    onError: (err) => toast.error(err, 'فشل إرسال القائمة'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const studentIds = parseIds(form.studentIds)
    const enrollmentIds = parseIds(form.enrollmentIds)

    createMutation.mutate({
      courseId: form.courseId,
      schoolId,
      studentIds,
      ...(enrollmentIds.length ? { enrollmentIds } : {}),
    })
  }

  return (
    <div>
      <PageHeader
        title="رفع أسماء الطلاب"
        description="إنشاء قائمة طلاب للامتحان وإرسالها إلى إدارة المرور"
      />

      <div className="grid gap-loose xl:grid-cols-2">
        <Card title="إنشاء قائمة جديدة">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="rosterCourse" className="block text-label-md text-on-surface">
                الدورة
              </label>
              <select
                id="rosterCourse"
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                required
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
              >
                <option value="">— اختر دورة —</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryCode}
                    {c.subTypeCode ? ` (${c.subTypeCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="studentIds" className="block text-label-md text-on-surface">
                معرّفات الطلاب (سطر أو فاصلة لكل معرّف)
              </label>
              <textarea
                id="studentIds"
                value={form.studentIds}
                onChange={(e) => setForm((f) => ({ ...f, studentIds: e.target.value }))}
                required
                rows={5}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="معرّف1&#10;معرّف2"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enrollmentIds" className="block text-label-md text-on-surface">
                معرّفات الاشتراك (اختياري)
              </label>
              <textarea
                id="enrollmentIds"
                value={form.enrollmentIds}
                onChange={(e) => setForm((f) => ({ ...f, enrollmentIds: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button type="submit" disabled={createMutation.isPending}>
              إنشاء القائمة
            </Button>
          </form>
        </Card>

        <Card title="إرسال القائمة">
          {createdRoster && (
            <div className="mb-comfortable rounded-lg bg-primary-container/30 p-comfortable text-body-md">
              <p className="text-label-md text-primary">آخر قائمة مُنشأة</p>
              <p className="mt-1 font-mono">{createdRoster._id}</p>
              <p className="mt-1 text-on-surface-variant">
                الحالة: {createdRoster.status || 'draft'} — {createdRoster.studentIds?.length ?? 0} طالب
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="معرّف القائمة للإرسال"
              value={submitId}
              onChange={(e) => setSubmitId(e.target.value)}
              placeholder="MongoDB ObjectId"
            />
            <Button
              className="w-full"
              onClick={() => submitMutation.mutate(submitId)}
              disabled={!submitId || submitMutation.isPending}
            >
              إرسال إلى المرور
            </Button>
          </div>

          <AsyncContent
            isLoading={coursesQuery.isLoading}
            error={coursesQuery.error}
            isEmpty={courses.length === 0}
            emptyTitle="لا توجد دورات"
            emptyDescription="أنشئ دورة أولاً قبل رفع قائمة الطلاب"
          >
            {() => (
<p className="mt-comfortable text-body-md text-on-surface-variant">
              {courses.length} دورة متاحة للاختيار عند إنشاء القائمة.
            </p>

            )}
          </AsyncContent>
        </Card>
      </div>
    </div>
  )
}
