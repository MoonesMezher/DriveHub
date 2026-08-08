import { Badge, Button, SafeImage } from '@/components/ui'
import { formatDateTime } from '@/lib/helpers/date'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

const UNLOCK_MODE_LABELS = {
  progressive: 'تدريجي',
  full: 'كامل',
}

const SAMPLE_TIER_LABELS = {
  partial: 'جزئي',
  full: 'كامل',
}

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-label-sm text-on-surface-variant">{label}</dt>
    <dd className="mt-0.5 break-words text-body-md text-on-surface">{value || '—'}</dd>
  </div>
)

const formatLicense = (item) => {
  if (!item?.categoryCode) return null
  return item.subTypeCode ? `${item.categoryCode} (${item.subTypeCode})` : item.categoryCode
}

export const ContentDetailPanel = ({ item, onClose, loading = false }) => {
  if (!item && !loading) return null

  const imageSrc = resolveMediaUrl(item?.imageUrl)
  const unlockLabel = item?.unlockMode
    ? (UNLOCK_MODE_LABELS[item.unlockMode] || item.unlockMode)
    : null

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label-md font-medium text-on-surface">تفاصيل المقال النظري</p>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        )}
      </div>

      {loading && !item ? (
        <p className="text-body-md text-on-surface-variant">جاري تحميل التفاصيل…</p>
      ) : (
        <>
          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">البيانات الأساسية</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="العنوان" value={item.title} />
              <Field label="النوع" value="مقال نظري" />
              <Field label="فئة الرخصة" value={formatLicense(item)} />
              <Field label="المرحلة" value={item.phase != null ? String(item.phase) : null} />
              <Field label="الترتيب" value={item.order != null ? String(item.order) : null} />
              <div className="min-w-0">
                <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
                <dd className="mt-0.5">
                  <Badge variant={item.isActive !== false ? 'success' : 'default'}>
                    {item.isActive !== false ? 'نشط' : 'معطّل'}
                  </Badge>
                </dd>
              </div>
              <Field label="وضع الفتح" value={unlockLabel} />
              <Field
                label="محتوى تجريبي"
                value={item.isSample
                  ? `نعم${item.sampleTier ? ` (${SAMPLE_TIER_LABELS[item.sampleTier] || item.sampleTier})` : ''}`
                  : 'لا'}
              />
              <Field
                label="تاريخ الإنشاء"
                value={item.createdAt ? formatDateTime(item.createdAt) : null}
              />
              <Field
                label="آخر تحديث"
                value={item.updatedAt ? formatDateTime(item.updatedAt) : null}
              />
              <Field label="معرّف المقال" value={item._id} />
            </dl>
          </div>

          {imageSrc && (
            <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
              <p className="text-label-md font-medium text-on-surface">الصورة</p>
              <SafeImage
                src={imageSrc}
                alt={item.title || 'صورة المقال'}
                className="max-h-64 w-full rounded-lg object-contain bg-surface"
              />
            </div>
          )}

          {item.videoUrl && (
            <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
              <p className="text-label-md font-medium text-on-surface">رابط الفيديو</p>
              <a
                href={item.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-body-md text-primary underline"
              >
                {item.videoUrl}
              </a>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">المحتوى</p>
            <p className="whitespace-pre-wrap text-body-md text-on-surface">
              {item.body || '—'}
            </p>
          </div>

          {Array.isArray(item.interactiveQuestions) && item.interactiveQuestions.length > 0 && (
            <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
              <p className="text-label-md font-medium text-on-surface">
                أسئلة تفاعلية ({item.interactiveQuestions.length})
              </p>
              <ul className="space-y-2">
                {item.interactiveQuestions.map((q, idx) => (
                  <li key={q._id || idx} className="text-body-md text-on-surface">
                    <span className="text-on-surface-variant">{idx + 1}.</span>{' '}
                    {q.text || '—'}
                    {q.type && (
                      <Badge variant="default" className="ms-2">
                        {q.type === 'true_false' ? 'صح / خطأ' : 'اختيار من متعدد'}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
