import { Badge, Button, SafeImage } from '@/components/ui'
import { formatDateTime } from '@/lib/helpers/date'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

const TYPE_LABELS = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح / خطأ',
}

const ANSWER_LABELS = {
  true: 'صح',
  false: 'خطأ',
}

const STATUS_LABELS = {
  active: 'نشط',
  archived: 'مؤرشف',
}

const DIFFICULTY_LABELS = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
}

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-label-sm text-on-surface-variant">{label}</dt>
    <dd className="mt-0.5 break-words text-body-md text-on-surface">{value || '—'}</dd>
  </div>
)

const formatLicense = (question, bank) => {
  const category = question?.categoryCode || bank?.categoryCode
  const subType = question?.subTypeCode || bank?.subTypeCode
  if (!category) return null
  return subType ? `${category} (${subType})` : category
}

const formatCorrectAnswer = (question) => {
  if (!question?.correctAnswer) return null
  const key = String(question.correctAnswer)
  if (ANSWER_LABELS[key]) return ANSWER_LABELS[key]
  const opt = (question.options || []).find((o) => String(o.key) === key)
  if (opt) return `${opt.key}: ${opt.text}`
  return key
}

export const QuestionDetailPanel = ({
  question,
  bank,
  onClose,
  loading = false,
}) => {
  if (!question && !loading) return null

  const imageSrc = resolveMediaUrl(question?.imageUrl)
  const options = question?.options || []

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label-md font-medium text-on-surface">تفاصيل السؤال</p>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        )}
      </div>

      {loading && !question ? (
        <p className="text-body-md text-on-surface-variant">جاري تحميل التفاصيل…</p>
      ) : (
        <>
          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">بيانات السؤال</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="النوع"
                value={TYPE_LABELS[question.type] || question.type}
              />
              <Field label="فئة الرخصة" value={formatLicense(question, bank)} />
              <Field
                label="البنك"
                value={bank
                  ? `${bank.isSystem ? '[نظام] ' : ''}${bank.title || '—'}`
                  : null}
              />
              <div className="min-w-0">
                <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
                <dd className="mt-0.5">
                  <Badge variant={question.status !== 'archived' ? 'success' : 'default'}>
                    {STATUS_LABELS[question.status] || question.status || 'نشط'}
                  </Badge>
                </dd>
              </div>
              <Field
                label="الصعوبة"
                value={DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
              />
              <Field label="الإجابة الصحيحة" value={formatCorrectAnswer(question)} />
              <Field
                label="تاريخ الإنشاء"
                value={question.createdAt ? formatDateTime(question.createdAt) : null}
              />
              <Field
                label="آخر تحديث"
                value={question.updatedAt ? formatDateTime(question.updatedAt) : null}
              />
              <Field label="معرّف السؤال" value={question._id} />
              {question.sourceTitle && (
                <Field label="مصدر (مقال نظري)" value={question.sourceTitle} />
              )}
            </dl>
          </div>

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">نص السؤال</p>
            <p className="whitespace-pre-wrap text-body-md text-on-surface">
              {question.text || '—'}
            </p>
          </div>

          {options.length > 0 && (
            <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
              <p className="text-label-md font-medium text-on-surface">الخيارات</p>
              <ul className="space-y-2">
                {options.map((opt) => {
                  const isCorrect = String(opt.key) === String(question.correctAnswer)
                  return (
                    <li
                      key={opt.key}
                      className={`rounded-md border px-3 py-2 text-body-md ${
                        isCorrect
                          ? 'border-success/40 bg-success-container/20 text-on-surface'
                          : 'border-outline-variant bg-surface text-on-surface'
                      }`}
                    >
                      <span className="font-medium">{opt.key}</span>
                      {': '}
                      {opt.text || '—'}
                      {isCorrect && (
                        <Badge variant="success" className="ms-2">صحيحة</Badge>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {imageSrc && (
            <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
              <p className="text-label-md font-medium text-on-surface">صورة السؤال</p>
              <SafeImage
                src={imageSrc}
                alt="صورة السؤال"
                className="max-h-64 w-full rounded-lg object-contain bg-surface"
              />
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">التفسير</p>
            <p className="whitespace-pre-wrap text-body-md text-on-surface">
              {question.explanation || '—'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
