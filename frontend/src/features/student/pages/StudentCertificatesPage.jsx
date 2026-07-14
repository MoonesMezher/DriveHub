import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, Icon } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { formatDateTime } from '@/lib/helpers/date'
import { certificateVerifyUrl, qrImageUrl } from '@/lib/helpers/verification'

export const StudentCertificatesPage = () => {
  const certsQuery = useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: async () => unwrap(await studentService.certificates()),
  })

  const certificates = certsQuery.data?.certificates ?? []

  return (
    <div dir="rtl">
      <PageHeader
        title="شهاداتي"
        description="الرخص والشهادات الصادرة مع رمز تحقق QR"
      />

      <AsyncContent
        isLoading={certsQuery.isLoading}
        error={certsQuery.error}
        isEmpty={!certificates.length}
        emptyIcon="workspace_premium"
        emptyTitle="لا توجد شهادات بعد"
        emptyDescription="ستظهر شهاداتك هنا بعد إصدار الرخصة من إدارة المرور"
      >
        {() => (
          <div className="grid gap-comfortable sm:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert._id}>
                <div className="flex flex-wrap gap-comfortable">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-success-container">
                    <Icon name="workspace_premium" size={28} className="text-on-success-container" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-headline-sm text-on-surface">
                      {cert.certificateNumber ?? cert.licenseNumber ?? 'شهادة رخصة'}
                    </p>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      فئة {cert.categoryCode}
                      {cert.subTypeCode ? ` (${cert.subTypeCode})` : ''}
                    </p>
                    {(cert.issueDate || cert.issuedAt) && (
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {formatDateTime(cert.issueDate ?? cert.issuedAt)}
                      </p>
                    )}
                    {cert.issuer && (
                      <p className="mt-1 text-label-sm text-on-surface-variant">{cert.issuer}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cert.categoryCode && (
                        <Badge variant="success">فئة {cert.categoryCode}</Badge>
                      )}
                    </div>
                  </div>
                  {cert.verificationToken && (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={qrImageUrl(certificateVerifyUrl(cert.verificationToken), 100)}
                        alt="رمز التحقق"
                        className="rounded-lg border border-outline-variant/40"
                        width={100}
                        height={100}
                      />
                      <span className="text-label-sm text-on-surface-variant">تحقق</span>
                    </div>
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
