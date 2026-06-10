import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent, StatusBadge } from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { EXAM_TYPE_LABELS } from '@/lib/constants/statusLabels'
import { useToast } from '@/hooks/useToast'

const resultLabels = {
  true: 'ناجح',
  false: 'راسب',
}

const resultVariants = {
  true: 'success',
  false: 'error',
}

export const TrafficResultsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [resultForm, setResultForm] = useState({
    studentId: '',
    enrollmentId: '',
    examType: 'theory',
    passed: 'true',
    score: '',
    scheduleId: '',
    notes: '',
  })

  const [licenseForm, setLicenseForm] = useState({
    userId: '',
    categoryCode: '',
    subTypeCode: '',
    issueDate: '',
    certificateNumber: '',
    enrollmentId: '',
  })

  const resultsQuery = useQuery({
    queryKey: ['traffic', 'results'],
    queryFn: () => trafficService.listResults().then(unwrap),
  })

  const results = resultsQuery.data?.results ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['traffic', 'results'] })

  const enterMutation = useMutation({
    mutationFn: (data) => trafficService.enterResult(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إدخال النتيجة')
      setResultForm({
        studentId: '',
        enrollmentId: '',
        examType: 'theory',
        passed: 'true',
        score: '',
        scheduleId: '',
        notes: '',
      })
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إدخال النتيجة'),
  })

  const licenseMutation = useMutation({
    mutationFn: (data) => trafficService.issueLicense(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إصدار الرخصة')
      setLicenseForm({
        userId: '',
        categoryCode: '',
        subTypeCode: '',
        issueDate: '',
        certificateNumber: '',
        enrollmentId: '',
      })
    },
    onError: (err) => toast.error(err, 'فشل إصدار الرخصة'),
  })

  const handleEnterResult = (e) => {
    e.preventDefault()
    enterMutation.mutate({
      studentId: resultForm.studentId.trim(),
      enrollmentId: resultForm.enrollmentId.trim(),
      examType: resultForm.examType,
      passed: resultForm.passed === 'true',
      ...(resultForm.score ? { score: Number(resultForm.score) } : {}),
      ...(resultForm.scheduleId ? { scheduleId: resultForm.scheduleId.trim() } : {}),
      ...(resultForm.notes ? { notes: resultForm.notes.trim() } : {}),
    })
  }

  const handleIssueLicense = (e) => {
    e.preventDefault()
    licenseMutation.mutate({
      userId: licenseForm.userId.trim(),
      categoryCode: licenseForm.categoryCode.trim().toUpperCase(),
      subTypeCode: licenseForm.subTypeCode.trim() || undefined,
      issueDate: new Date(licenseForm.issueDate).toISOString(),
      ...(licenseForm.certificateNumber
        ? { certificateNumber: licenseForm.certificateNumber.trim() }
        : {}),
      ...(licenseForm.enrollmentId ? { enrollmentId: licenseForm.enrollmentId.trim() } : {}),
    })
  }

  return (
    <div>
      <PageHeader
        title="إدخال النتائج"
        description="تسجيل نتائج الامتحان وإصدار الرخص"
      />

      <div className="mb-loose grid gap-loose xl:grid-cols-2">
        <Card title="إدخال نتيجة">
          <form onSubmit={handleEnterResult} className="space-y-4">
            <Input
              label="معرّف الطالب"
              value={resultForm.studentId}
              onChange={(e) => setResultForm((f) => ({ ...f, studentId: e.target.value }))}
              required
            />
            <Input
              label="معرّف الاشتراك"
              value={resultForm.enrollmentId}
              onChange={(e) => setResultForm((f) => ({ ...f, enrollmentId: e.target.value }))}
              required
            />
            <div className="space-y-2">
              <label htmlFor="resultExamType" className="block text-label-md text-on-surface">
                نوع الامتحان
              </label>
              <select
                id="resultExamType"
                value={resultForm.examType}
                onChange={(e) => setResultForm((f) => ({ ...f, examType: e.target.value }))}
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
              >
                <option value="theory">نظري</option>
                <option value="practical">عملي</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="passed" className="block text-label-md text-on-surface">
                النتيجة
              </label>
              <select
                id="passed"
                value={resultForm.passed}
                onChange={(e) => setResultForm((f) => ({ ...f, passed: e.target.value }))}
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
              >
                <option value="true">ناجح</option>
                <option value="false">راسب</option>
              </select>
            </div>
            <Input
              label="العلامة (اختياري)"
              type="number"
              min={0}
              max={100}
              value={resultForm.score}
              onChange={(e) => setResultForm((f) => ({ ...f, score: e.target.value }))}
            />
            <Input
              label="معرّف الموعد (اختياري)"
              value={resultForm.scheduleId}
              onChange={(e) => setResultForm((f) => ({ ...f, scheduleId: e.target.value }))}
            />
            <Input
              label="ملاحظات (اختياري)"
              value={resultForm.notes}
              onChange={(e) => setResultForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <Button type="submit" disabled={enterMutation.isPending}>
              حفظ النتيجة
            </Button>
          </form>
        </Card>

        <Card title="إصدار رخصة">
          <form onSubmit={handleIssueLicense} className="space-y-4">
            <Input
              label="معرّف المستخدم"
              value={licenseForm.userId}
              onChange={(e) => setLicenseForm((f) => ({ ...f, userId: e.target.value }))}
              required
            />
            <Input
              label="رمز الفئة"
              value={licenseForm.categoryCode}
              onChange={(e) => setLicenseForm((f) => ({ ...f, categoryCode: e.target.value }))}
              required
            />
            <Input
              label="النوع الفرعي (اختياري)"
              value={licenseForm.subTypeCode}
              onChange={(e) => setLicenseForm((f) => ({ ...f, subTypeCode: e.target.value }))}
            />
            <Input
              label="تاريخ الإصدار"
              type="date"
              value={licenseForm.issueDate}
              onChange={(e) => setLicenseForm((f) => ({ ...f, issueDate: e.target.value }))}
              required
            />
            <Input
              label="رقم الشهادة (اختياري)"
              value={licenseForm.certificateNumber}
              onChange={(e) => setLicenseForm((f) => ({ ...f, certificateNumber: e.target.value }))}
            />
            <Input
              label="معرّف الاشتراك (اختياري)"
              value={licenseForm.enrollmentId}
              onChange={(e) => setLicenseForm((f) => ({ ...f, enrollmentId: e.target.value }))}
            />
            <Button type="submit" disabled={licenseMutation.isPending}>
              إصدار الرخصة
            </Button>
          </form>
        </Card>
      </div>

      <Card title="النتائج المسجّلة">
        <AsyncContent
          isLoading={resultsQuery.isLoading}
          error={resultsQuery.error}
          isEmpty={results.length === 0}
          emptyTitle="لا توجد نتائج"
        >
          {() => (
<div className="overflow-x-auto">
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                  <th className="py-3 pe-4 text-start">الطالب</th>
                  <th className="py-3 pe-4 text-start">النوع</th>
                  <th className="py-3 pe-4 text-start">النتيجة</th>
                  <th className="py-3 pe-4 text-start">العلامة</th>
                  <th className="py-3 pe-4 text-start">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result._id} className="border-b border-outline-variant/50 last:border-0">
                    <td className="py-3 pe-4">{result.studentId?.name || '—'}</td>
                    <td className="py-3 pe-4">{EXAM_TYPE_LABELS[result.examType] || result.examType}</td>
                    <td className="py-3 pe-4">
                      <StatusBadge
                        status={String(result.passed)}
                        labels={resultLabels}
                        variants={resultVariants}
                      />
                    </td>
                    <td className="py-3 pe-4">{result.score ?? '—'}</td>
                    <td className="py-3 pe-4">{formatDate(result.resultDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          )}
        </AsyncContent>
      </Card>
    </div>
  )
}
