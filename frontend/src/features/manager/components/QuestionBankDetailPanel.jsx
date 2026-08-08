import { Badge, Button } from '@/components/ui'
import { formatDateTime } from '@/lib/helpers/date'

const BANK_STATUS_LABELS = {
  draft: 'مسودة',
  active: 'نشط',
  archived: 'مؤرشف',
}

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-label-sm text-on-surface-variant">{label}</dt>
    <dd className="mt-0.5 break-words text-body-md text-on-surface">{value || '—'}</dd>
  </div>
)

const formatLicense = (bank) => {
  if (!bank?.categoryCode) return null
  return bank.subTypeCode ? `${bank.categoryCode} (${bank.subTypeCode})` : bank.categoryCode
}

export const QuestionBankDetailPanel = ({ bank, onClose, loading = false }) => {
  if (!bank && !loading) return null

  const statusLabel = bank?.isSystem
    ? 'نظام كامل'
    : (BANK_STATUS_LABELS[bank?.status] || bank?.status || null)

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label-md font-medium text-on-surface">تفاصيل بنك الأسئلة</p>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        )}
      </div>

      {loading && !bank ? (
        <p className="text-body-md text-on-surface-variant">جاري تحميل التفاصيل…</p>
      ) : (
        <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
          <p className="text-label-md font-medium text-on-surface">بيانات البنك</p>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="الاسم" value={bank.title} />
            <Field label="النوع" value={bank.isSystem ? 'بنك نظام' : 'بنك مدرسة'} />
            <Field label="فئة الرخصة" value={formatLicense(bank)} />
            <div className="min-w-0">
              <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
              <dd className="mt-0.5">
                <Badge variant={bank.status === 'active' || bank.isSystem ? 'success' : 'default'}>
                  {statusLabel || '—'}
                </Badge>
              </dd>
            </div>
            <Field
              label="عدد الأسئلة"
              value={String(bank.questions?.length ?? 0)}
            />
            <Field
              label="تاريخ الإنشاء"
              value={bank.createdAt ? formatDateTime(bank.createdAt) : null}
            />
            <Field
              label="آخر تحديث"
              value={bank.updatedAt ? formatDateTime(bank.updatedAt) : null}
            />
            <Field label="معرّف البنك" value={bank._id} />
            {bank.schoolId && (
              <Field
                label="معرّف المدرسة"
                value={typeof bank.schoolId === 'object' ? bank.schoolId._id || bank.schoolId.id : bank.schoolId}
              />
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
