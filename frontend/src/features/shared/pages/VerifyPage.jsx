import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, AsyncContent, Alert, Badge } from '@/components/ui'
import { verifyService } from '@/lib/services/verifyService'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatDateTime } from '@/lib/helpers/date'

const VERIFY_META = {
  statistics: {
    title: 'التحقق من إحصائيات الطالب',
    fetch: (token) => verifyService.statistics(token),
  },
  certificate: {
    title: 'التحقق من الشهادة / الرخصة',
    fetch: (token) => verifyService.certificate(token),
  },
  roster: {
    title: 'التحقق من قائمة الطلاب',
    fetch: (token) => verifyService.roster(token),
  },
}

const StatisticsResult = ({ data }) => (
  <dl className="space-y-3 text-body-md">
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الطالب</dt>
      <dd>{data.studentName ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الفئة</dt>
      <dd>{data.categoryCode ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">التقدم</dt>
      <dd>{data.progressPercent ?? 0}%</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الدروس المكتملة</dt>
      <dd>{data.lessonsCompleted ?? 0} / {data.lessonsTotal ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الحضور</dt>
      <dd>{data.attendancePercent ?? 0}%</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">المدرسة</dt>
      <dd>{data.school?.name ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">وقت التحقق</dt>
      <dd>{formatDateTime(data.verifiedAt)}</dd>
    </div>
  </dl>
)

const CertificateResult = ({ data }) => (
  <dl className="space-y-3 text-body-md">
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الطالب</dt>
      <dd>{data.studentName ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">رقم الشهادة</dt>
      <dd>{data.certificateNumber ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الفئة</dt>
      <dd>{data.categoryCode ?? '—'}{data.subTypeCode ? ` (${data.subTypeCode})` : ''}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">تاريخ الإصدار</dt>
      <dd>{formatDateTime(data.issueDate)}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الجهة المصدرة</dt>
      <dd>{data.issuer ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">وقت التحقق</dt>
      <dd>{formatDateTime(data.verifiedAt)}</dd>
    </div>
  </dl>
)

const RosterResult = ({ data }) => (
  <dl className="space-y-3 text-body-md">
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">المدرسة</dt>
      <dd>{data.school?.name ?? data.qrPayload?.schoolName ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">الفئة</dt>
      <dd>
        {data.course?.categoryCode ?? data.qrPayload?.categoryCode ?? '—'}
        {data.course?.subTypeCode ? ` (${data.course.subTypeCode})` : ''}
      </dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">عدد الطلاب</dt>
      <dd>{data.studentCount ?? data.qrPayload?.studentCount ?? '—'}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">تاريخ الإرسال</dt>
      <dd>{formatDateTime(data.submittedAt)}</dd>
    </div>
    {data.trafficBatchId && (
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">دفعة المرور</dt>
        <dd>{data.trafficBatchId}</dd>
      </div>
    )}
  </dl>
)

const RESULT_RENDERERS = {
  statistics: StatisticsResult,
  certificate: CertificateResult,
  roster: RosterResult,
}

export const VerifyPage = () => {
  const { type, token } = useParams()
  const meta = VERIFY_META[type]

  const verifyQuery = useQuery({
    queryKey: ['verify', type, token],
    queryFn: async () => {
      if (!meta || !token) throw new Error('رمز التحقق غير صالح')
      return unwrap(await meta.fetch(token))
    },
    enabled: Boolean(meta && token),
    retry: false,
  })

  const verification = verifyQuery.data?.verification ?? verifyQuery.data
  const ResultView = RESULT_RENDERERS[type]

  if (!meta) {
    return (
      <div dir="rtl" className="mx-auto max-w-lg py-loose">
        <Alert variant="error" title="رابط غير صالح">نوع التحقق غير معروف.</Alert>
      </div>
    )
  }

  return (
    <div dir="rtl" className="mx-auto max-w-2xl py-loose">
      <PageHeader
        title={meta.title}
        description="صفحة عامة للتحقق من صحة البيانات — يُسجّل كل مسح في سجل التدقيق"
      />

      <AsyncContent
        isLoading={verifyQuery.isPending}
        error={verifyQuery.error}
        isEmpty={!verification?.valid}
        emptyIcon="qr_code_scanner"
        emptyTitle="تعذّر التحقق"
        emptyDescription={verifyQuery.error ? getErrorMessage(verifyQuery.error) : 'الرمز غير صالح أو منتهي.'}
      >
        {() =>
          verification?.valid && ResultView ? (
            <Card padding="lg">
              <div className="mb-comfortable flex flex-wrap gap-2">
                <Badge variant="success">بيانات صالحة</Badge>
                <Badge variant="default">{verification.status || verification.type}</Badge>
              </div>
              <ResultView data={verification} />
            </Card>
          ) : null
        }
      </AsyncContent>
    </div>
  )
}
