import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import {
  PageHeader,
  Card,
  Button,
  Input,
  DataTable,
  Pagination,
  SkeletonTable,
  Alert,
  FormSection,
  Select,
  Textarea,
  FileUpload,
  Tabs,
  Dialog,
  StatusBadge,
  Icon,
} from '@/components/ui'
import { trafficService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { formatNumber } from '@/lib/helpers/format'
import { getErrorMessage } from '@/lib/helpers/error'
import { EXAM_TYPE_LABELS } from '@/lib/constants/statusLabels'
import {
  TRAFFIC_RESULTS_IMPORT_COLUMNS,
  mapImportRow,
  validateImportRow,
  toApiPayload,
} from '@/lib/constants/trafficResultsImport'
import { useToast } from '@/hooks/useToast'

const PAGE_SIZE = 10

const TABS = [
  { id: 'enter', label: 'إدخال نتيجة' },
  { id: 'import', label: 'استيراد Excel' },
  { id: 'log', label: 'السجل' },
]

const resultLabels = {
  true: 'ناجح',
  false: 'راسب',
}

const resultVariants = {
  true: 'success',
  false: 'error',
}

const EXAM_TYPE_OPTIONS = [
  { value: 'theory', label: 'نظري' },
  { value: 'practical', label: 'عملي' },
]

const PASSED_OPTIONS = [
  { value: 'true', label: 'ناجح' },
  { value: 'false', label: 'راسب' },
]

const enrollmentLabel = (entry) => {
  const name = entry.userId?.name || 'طالب'
  const school = entry.schoolId?.name || ''
  const category = entry.categoryCode || ''
  return `${name} — ${category}${entry.subTypeCode ? ` (${entry.subTypeCode})` : ''}${school ? ` · ${school}` : ''}`
}

export const TrafficResultsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('enter')
  const [page, setPage] = useState(1)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [importPreview, setImportPreview] = useState([])
  const [importErrors, setImportErrors] = useState([])
  const [selectedFileName, setSelectedFileName] = useState('')

  const [resultForm, setResultForm] = useState({
    enrollmentId: '',
    examType: 'theory',
    passed: 'true',
    score: '',
    notes: '',
  })

  const [licenseForm, setLicenseForm] = useState({
    enrollmentId: '',
    issueDate: '',
    certificateNumber: '',
  })

  const enrollmentsQuery = useQuery({
    queryKey: ['traffic', 'enrollments'],
    queryFn: () => trafficService.listEnrollments().then(unwrap),
  })

  const resultsQuery = useQuery({
    queryKey: ['traffic', 'results'],
    queryFn: () => trafficService.listResults().then(unwrap),
  })

  const enrollments = enrollmentsQuery.data?.enrollments ?? []
  const results = resultsQuery.data?.results ?? []

  const enrollmentOptions = enrollments.map((entry) => ({
    value: entry._id,
    label: enrollmentLabel(entry),
  }))

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedResultEnrollment = useMemo(
    () => enrollments.find((e) => e._id === resultForm.enrollmentId),
    [enrollments, resultForm.enrollmentId],
  )

  const selectedLicenseEnrollment = useMemo(
    () => enrollments.find((e) => e._id === licenseForm.enrollmentId),
    [enrollments, licenseForm.enrollmentId],
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['traffic', 'results'] })

  const enterMutation = useMutation({
    mutationFn: (data) => trafficService.enterResult(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إدخال النتيجة')
      setResultForm({
        enrollmentId: '',
        examType: 'theory',
        passed: 'true',
        score: '',
        notes: '',
      })
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إدخال النتيجة'),
  })

  const bulkMutation = useMutation({
    mutationFn: (rows) => trafficService.bulkEnterResults(rows).then(unwrap),
    onSuccess: (data) => {
      const imported = data?.imported ?? 0
      const failed = data?.failed ?? 0
      if (imported > 0) {
        toast.success(`تم رفع ${formatNumber(imported)} نتيجة بنجاح`)
      }
      if (failed > 0) {
        toast.error(`فشل ${formatNumber(failed)} صف — راجع التفاصيل أدناه`)
        setImportErrors(data?.errors ?? [])
      } else {
        setImportErrors([])
        setImportPreview([])
        setSelectedFileName('')
      }
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل رفع الملف'),
  })

  const licenseMutation = useMutation({
    mutationFn: (data) => trafficService.issueLicense(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إصدار الرخصة')
      setLicenseForm({
        enrollmentId: '',
        issueDate: '',
        certificateNumber: '',
      })
    },
    onError: (err) => toast.error(err, 'فشل إصدار الرخصة'),
  })

  const handleEnterResult = (e) => {
    e.preventDefault()
    const enrollment = selectedResultEnrollment
    if (!enrollment) {
      toast.error('اختر اشتراكاً')
      return
    }
    const studentId = enrollment.userId?._id || enrollment.userId
    enterMutation.mutate({
      studentId: String(studentId),
      enrollmentId: resultForm.enrollmentId,
      examType: resultForm.examType,
      passed: resultForm.passed === 'true',
      ...(resultForm.score ? { score: Number(resultForm.score) } : {}),
      ...(resultForm.notes ? { notes: resultForm.notes.trim() } : {}),
    })
  }

  const parseExcelFile = async (file) => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    const mappedRows = rawRows.map(mapImportRow)
    const validationErrors = []
    const payload = []

    mappedRows.forEach((row, index) => {
      const rowNumber = index + 2
      validationErrors.push(...validateImportRow(row, rowNumber))
      if (Object.keys(row).length > 0) {
        payload.push(toApiPayload(row))
      }
    })

    if (payload.length === 0) {
      throw new Error('الملف فارغ أو لا يحتوي على صفوف صالحة')
    }

    return { payload, validationErrors, preview: mappedRows.filter((r) => Object.keys(r).length > 0) }
  }

  const handleFileChange = async (file) => {
    if (!file) return

    setImportErrors([])
    setSelectedFileName(file.name)

    try {
      const { payload, validationErrors, preview } = await parseExcelFile(file)
      setImportPreview(preview)
      if (validationErrors.length > 0) {
        setImportErrors(validationErrors.map((message) => ({ row: '—', message })))
        toast.error('يوجد أخطاء في الملف — راجع الأعمدة المطلوبة')
        return
      }
      bulkMutation.mutate(payload)
    } catch (err) {
      toast.error(err.message || 'تعذّر قراءة الملف')
      setImportPreview([])
    }
  }

  const handleIssueLicense = (e) => {
    e.preventDefault()
    const enrollment = selectedLicenseEnrollment
    if (!enrollment) {
      toast.error('اختر اشتراكاً')
      return
    }
    const userId = enrollment.userId?._id || enrollment.userId
    licenseMutation.mutate({
      userId: String(userId),
      categoryCode: enrollment.categoryCode,
      subTypeCode: enrollment.subTypeCode || undefined,
      issueDate: new Date(licenseForm.issueDate).toISOString(),
      enrollmentId: licenseForm.enrollmentId,
      ...(licenseForm.certificateNumber
        ? { certificateNumber: licenseForm.certificateNumber.trim() }
        : {}),
    })
  }

  const resultColumns = [
    {
      key: 'student',
      label: 'الطالب',
      render: (result) => result.studentId?.name || '—',
    },
    {
      key: 'examType',
      label: 'النوع',
      render: (result) => EXAM_TYPE_LABELS[result.examType] || result.examType,
    },
    {
      key: 'passed',
      label: 'النتيجة',
      render: (result) => (
        <StatusBadge
          status={String(result.passed)}
          labels={resultLabels}
          variants={resultVariants}
        />
      ),
    },
    {
      key: 'score',
      label: 'العلامة',
      render: (result) => (result.score != null ? formatNumber(result.score) : '—'),
    },
    {
      key: 'resultDate',
      label: 'التاريخ',
      render: (result) => formatDate(result.resultDate),
    },
  ]

  return (
    <div>
      <PageHeader
        variant="compact"
        title="إدخال النتائج"
        description="تسجيل نتائج الامتحان وإصدار الرخص"
      />

      <Card padding="none">
        <Tabs tabs={TABS} activeId={tab} onChange={setTab} className="px-comfortable" />

        <div className="p-comfortable">
          {tab === 'enter' && (
            <div className="grid gap-loose xl:grid-cols-2">
              <Card title="إدخال نتيجة" variant="default" padding="md" className="border-0 shadow-none">
                <form onSubmit={handleEnterResult}>
                  <FormSection>
                    <Select
                      label="الاشتراك / الطالب"
                      placeholder="— اختر اشتراكاً —"
                      value={resultForm.enrollmentId}
                      onChange={(e) =>
                        setResultForm((f) => ({ ...f, enrollmentId: e.target.value }))
                      }
                      options={enrollmentOptions}
                      required
                    />
                    <Select
                      label="نوع الامتحان"
                      value={resultForm.examType}
                      onChange={(e) => setResultForm((f) => ({ ...f, examType: e.target.value }))}
                      options={EXAM_TYPE_OPTIONS}
                    />
                    <Select
                      label="النتيجة"
                      value={resultForm.passed}
                      onChange={(e) => setResultForm((f) => ({ ...f, passed: e.target.value }))}
                      options={PASSED_OPTIONS}
                    />
                    <Input
                      label="العلامة (اختياري)"
                      type="number"
                      min={0}
                      max={100}
                      value={resultForm.score}
                      onChange={(e) => setResultForm((f) => ({ ...f, score: e.target.value }))}
                    />
                    <Textarea
                      label="ملاحظات (اختياري)"
                      rows={2}
                      value={resultForm.notes}
                      onChange={(e) => setResultForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                    <Button type="submit" disabled={enterMutation.isPending || enrollmentsQuery.isLoading}>
                      حفظ النتيجة
                    </Button>
                  </FormSection>
                </form>
              </Card>

              <Card title="إصدار رخصة" variant="default" padding="md" className="border-0 shadow-none">
                <form onSubmit={handleIssueLicense}>
                  <FormSection>
                    <Select
                      label="الاشتراك / الطالب"
                      placeholder="— اختر اشتراكاً —"
                      value={licenseForm.enrollmentId}
                      onChange={(e) => setLicenseForm((f) => ({ ...f, enrollmentId: e.target.value }))}
                      options={enrollmentOptions}
                      required
                    />
                    {selectedLicenseEnrollment && (
                      <Alert variant="info">
                        فئة الرخصة: {selectedLicenseEnrollment.categoryCode}
                        {selectedLicenseEnrollment.subTypeCode
                          ? ` (${selectedLicenseEnrollment.subTypeCode})`
                          : ''}
                      </Alert>
                    )}
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
                    <Button type="submit" disabled={licenseMutation.isPending || enrollmentsQuery.isLoading}>
                      إصدار الرخصة
                    </Button>
                  </FormSection>
                </form>
              </Card>
            </div>
          )}

          {tab === 'import' && (
            <FormSection
              title="رفع نتائج من Excel"
              description="ارفع ملف Excel (.xlsx / .xls) يحوي نتائج عدة طلاب دفعة واحدة. يُطابق كل صف اشتراكاً عبر البريد الإلكتروني وفئة الرخصة — راجع دليل الأعمدة. نموذج جاهز: docs/traffic-results-import-sample.xlsx"
            >
              <FileUpload
                accept=".xlsx,.xls,.csv"
                hint="يجب أن يتضمن الملف الأعمدة المطلوبة — راجع دليل الأعمدة"
                onChange={handleFileChange}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => setColumnsOpen(true)}>
                  <Icon name="table_chart" size={20} />
                  دليل الأعمدة المطلوبة
                </Button>
                {selectedFileName && (
                  <span className="text-label-md text-on-surface-variant">{selectedFileName}</span>
                )}
                {bulkMutation.isPending && (
                  <span className="text-label-md text-primary">جاري الرفع...</span>
                )}
              </div>

              {importPreview.length > 0 && (
                <p className="text-label-md text-on-surface-variant">
                  صفوف مُعالجة من الملف: {formatNumber(importPreview.length)}
                </p>
              )}

              {importErrors.length > 0 && (
                <Alert variant="error" title="أخطاء الاستيراد">
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-body-sm">
                    {importErrors.map((err, idx) => (
                      <li key={`${err.row}-${idx}`}>
                        {err.row !== '—' ? `صف ${err.row}: ` : ''}
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}
            </FormSection>
          )}

          {tab === 'log' && (
            <>
              {resultsQuery.isLoading ? (
                <SkeletonTable rows={6} cols={5} />
              ) : resultsQuery.error ? (
                <Alert variant="error" title="حدث خطأ">{getErrorMessage(resultsQuery.error)}</Alert>
              ) : (
                <>
                  <DataTable
                    columns={resultColumns}
                    rows={paginatedResults}
                    emptyLabel="لا توجد نتائج"
                  />
                  <div className="mt-comfortable">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <Dialog open={columnsOpen} onClose={() => setColumnsOpen(false)} size="xl">
        <h3 className="mb-4 text-headline-sm text-on-surface">دليل الأعمدة وأنواعها</h3>
        <DataTable
          columns={[
            {
              key: 'label',
              label: 'العمود',
              render: (col) => (
                <span className="font-medium text-on-surface">
                  {col.label}
                  {col.required && <span className="text-error"> *</span>}
                </span>
              ),
            },
            { key: 'type', label: 'النوع' },
            {
              key: 'required',
              label: 'إلزامي',
              render: (col) => (col.required ? 'نعم' : 'لا'),
            },
            {
              key: 'example',
              label: 'مثال',
              render: (col) => <span className="font-mono text-label-sm text-primary">{col.example}</span>,
            },
          ]}
          rows={TRAFFIC_RESULTS_IMPORT_COLUMNS}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setColumnsOpen(false)}>حسناً</Button>
        </div>
      </Dialog>
    </div>
  )
}
