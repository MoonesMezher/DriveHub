import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, DataTable, SkeletonTable, Alert, FormSection,
  Select, Checkbox, AsyncContent,
} from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { rosterVerifyUrl, rosterQrImageUrl } from '@/lib/helpers/roster'

export const ManagerRosterPage = () => {
  const toast = useToast()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [form, setForm] = useState({ courseId: '', selectedStudentIds: [] })
  const [createdRoster, setCreatedRoster] = useState(null)
  const [submitId, setSubmitId] = useState('')
  const [lastSubmitted, setLastSubmitted] = useState(null)

  const coursesQuery = useQuery({
    queryKey: ['manager', 'courses'],
    queryFn: () => managerService.listCourses().then(unwrap),
  })

  const candidatesQuery = useQuery({
    queryKey: ['manager', 'rosterCandidates', form.courseId],
    queryFn: () => managerService.rosterCandidates(form.courseId).then(unwrap),
    enabled: Boolean(form.courseId),
  })

  const rostersQuery = useQuery({
    queryKey: ['manager', 'rosters'],
    queryFn: () => managerService.listRosters().then(unwrap),
  })

  const courses = coursesQuery.data?.courses ?? []
  const candidates = candidatesQuery.data?.candidates ?? []
  const rosters = rostersQuery.data?.rosters ?? []
  const draftRosters = rosters.filter((r) => r.status === 'draft')
  const submittedRosters = rosters.filter((r) => r.status !== 'draft' && r.verificationToken)

  const courseOptions = courses.map((c) => ({
    value: c._id,
    label: `${c.categoryCode}${c.subTypeCode ? ` (${c.subTypeCode})` : ''}`,
  }))

  const draftOptions = draftRosters.map((roster) => ({
    value: roster._id,
    label: `${roster.courseId?.categoryCode || 'دورة'}${roster.courseId?.subTypeCode ? ` (${roster.courseId.subTypeCode})` : ''} — ${roster.studentIds?.length ?? 0} طالب`,
  }))

  const createMutation = useMutation({
    mutationFn: (data) => managerService.createRoster(data).then(unwrap),
    onSuccess: (data) => {
      const roster = data?.roster ?? data
      toast.success('تم إنشاء القائمة')
      setCreatedRoster(roster)
      if (roster?._id) setSubmitId(roster._id)
      setForm({ courseId: '', selectedStudentIds: [] })
      rostersQuery.refetch()
    },
    onError: (err) => toast.error(err, 'فشل إنشاء القائمة'),
  })

  const submitMutation = useMutation({
    mutationFn: (id) => managerService.submitRoster(id).then(unwrap),
    onSuccess: (data) => {
      const roster = data?.roster ?? data
      toast.success('تم إرسال القائمة إلى المرور')
      setLastSubmitted(roster)
      setCreatedRoster(null)
      setSubmitId('')
      rostersQuery.refetch()
    },
    onError: (err) => toast.error(err, 'فشل إرسال القائمة'),
  })

  const toggleStudent = (userId) => {
    setForm((f) => ({
      ...f,
      selectedStudentIds: f.selectedStudentIds.includes(userId)
        ? f.selectedStudentIds.filter((id) => id !== userId)
        : [...f.selectedStudentIds, userId],
    }))
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.selectedStudentIds.length) {
      toast.error('اختر طالباً واحداً على الأقل')
      return
    }

    createMutation.mutate({
      courseId: form.courseId,
      schoolId,
      studentIds: form.selectedStudentIds,
    })
  }

  const submittedColumns = [
    {
      key: 'course',
      label: 'الدورة',
      render: (roster) =>
        `${roster.courseId?.categoryCode || 'دورة'}${roster.courseId?.subTypeCode ? ` (${roster.courseId.subTypeCode})` : ''}`,
    },
    {
      key: 'count',
      label: 'عدد الطلاب',
      render: (roster) => roster.studentIds?.length ?? 0,
    },
    {
      key: 'qr',
      label: 'QR',
      render: (roster) => (
        <img
          src={rosterQrImageUrl(roster.verificationToken, 80)}
          alt="QR"
          className="rounded border border-outline-variant/50 bg-white p-1"
        />
      ),
    },
    {
      key: 'token',
      label: 'رمز التحقق',
      render: (roster) => (
        <span className="break-all font-mono text-label-sm">{roster.verificationToken}</span>
      ),
    },
    {
      key: 'link',
      label: 'رابط',
      render: (roster) => (
        <a
          href={rosterVerifyUrl(roster.verificationToken)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          تحقق
        </a>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="رفع أسماء الطلاب"
        description="إنشاء قائمة طلاب للامتحان وإرسالها إلى إدارة المرور"
      />

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <div className="space-y-loose">
          <Card title="إنشاء قائمة جديدة">
            <form onSubmit={handleCreate}>
              <FormSection>
                <Select
                  label="الدورة"
                  placeholder="— اختر دورة —"
                  value={form.courseId}
                  onChange={(e) =>
                    setForm({ courseId: e.target.value, selectedStudentIds: [] })
                  }
                  options={courseOptions}
                  required
                />

                {form.courseId && (
                  <div className="space-y-2">
                    <p className="text-label-md text-on-surface">الطلاب المؤهلون</p>
                    {candidatesQuery.isLoading ? (
                      <SkeletonTable rows={3} cols={1} />
                    ) : candidatesQuery.error ? (
                      <Alert variant="error" title="حدث خطأ">
                        {getErrorMessage(candidatesQuery.error)}
                      </Alert>
                    ) : candidates.length === 0 ? (
                      <p className="text-body-md text-on-surface-variant">لا يوجد طلاب مؤهلون</p>
                    ) : (
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-outline-variant p-3">
                        {candidates.map((entry) => {
                          const studentId = entry.userId?._id || entry.userId
                          const label = entry.userId?.name || entry.userId?.email || studentId
                          return (
                            <Checkbox
                              key={entry._id}
                              label={`${label} (${entry.categoryCode}${entry.subTypeCode ? ` · ${entry.subTypeCode}` : ''})`}
                              checked={form.selectedStudentIds.includes(String(studentId))}
                              onChange={() => toggleStudent(String(studentId))}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={createMutation.isPending || !form.selectedStudentIds.length}>
                  إنشاء القائمة
                </Button>
              </FormSection>
            </form>
          </Card>

          {submittedRosters.length > 0 && (
            <Card title="قوائم مُرسَلة — روابط التحقق" padding="none">
              <DataTable columns={submittedColumns} rows={submittedRosters} />
            </Card>
          )}
        </div>

        <Card title="إرسال القائمة" className="xl:sticky xl:top-24 xl:self-start">
          {createdRoster && (
            <Alert variant="success" title="آخر قائمة مُنشأة" className="mb-comfortable">
              الحالة: {createdRoster.status || 'draft'} — {createdRoster.studentIds?.length ?? 0} طالب
            </Alert>
          )}

          <FormSection>
            <Select
              label="القائمة للإرسال"
              placeholder="— اختر قائمة —"
              value={submitId}
              onChange={(e) => setSubmitId(e.target.value)}
              options={draftOptions}
            />
            <Button
              className="w-full"
              onClick={() => submitMutation.mutate(submitId)}
              disabled={!submitId || submitMutation.isPending}
            >
              إرسال إلى المرور
            </Button>
          </FormSection>

          {lastSubmitted?.verificationToken && (
            <div className="mt-comfortable rounded-lg border border-outline-variant p-comfortable text-body-md">
              <p className="text-label-md text-on-surface">رمز التحقق وQR</p>
              <img
                src={rosterQrImageUrl(lastSubmitted.verificationToken, 140)}
                alt="QR للتحقق من القائمة"
                className="mt-3 rounded-lg border border-outline-variant/50 bg-white p-2"
              />
              <p className="mt-2 break-all font-mono text-label-sm">{lastSubmitted.verificationToken}</p>
              <a
                href={rosterVerifyUrl(lastSubmitted.verificationToken)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-primary underline"
              >
                رابط التحقق العام
              </a>
            </div>
          )}

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
