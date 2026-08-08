import { Button, StatusBadge } from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/helpers/date'

const instructorStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const instructorStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const GENDER_LABELS = {
  male: 'ذكر',
  female: 'أنثى',
}

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-label-sm text-on-surface-variant">{label}</dt>
    <dd className="mt-0.5 break-words text-body-md text-on-surface">{value || '—'}</dd>
  </div>
)

const linkedUserId = (user) => {
  if (!user) return null
  if (typeof user === 'string') return user
  return user._id || user.id || null
}

export const InstructorDetailPanel = ({
  instructor,
  onClose,
  onToggleStatus,
  statusPending = false,
}) => {
  if (!instructor) return null

  const user = typeof instructor.userId === 'object' && instructor.userId ? instructor.userId : {}
  const userId = linkedUserId(instructor.userId)
  const gender = instructor.gender || user.gender
  const genderLabel = gender ? (GENDER_LABELS[gender] || gender) : null
  const categories = (instructor.licenseCategories || []).join('، ')
  const isActive = instructor.status === 'active'

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label-md font-medium text-on-surface">تفاصيل المدرب</p>
        <div className="flex flex-wrap items-center gap-2">
          {typeof onToggleStatus === 'function' && (
            <Button
              size="sm"
              variant={isActive ? 'danger' : 'outline'}
              disabled={statusPending}
              onClick={() => onToggleStatus(instructor)}
            >
              {statusPending
                ? 'جاري التحديث…'
                : isActive
                  ? 'إيقاف المدرب'
                  : 'إعادة تفعيل المدرب'}
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">البيانات الشخصية</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الاسم" value={user.name} />
          <Field label="البريد الإلكتروني" value={user.email} />
          <Field label="رقم الهاتف" value={user.phone} />
          {genderLabel && <Field label="الجنس" value={genderLabel} />}
          <Field
            label="مدربة (للطلاب الإناث)"
            value={instructor.isFemaleCoach ? 'نعم' : 'لا'}
          />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">بيانات المدرب في المدرسة</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="فئات الرخص / التخصصات" value={categories} />
          <div className="min-w-0">
            <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
            <dd className="mt-0.5">
              <StatusBadge
                status={instructor.status}
                labels={instructorStatusLabels}
                variants={instructorStatusVariants}
              />
            </dd>
          </div>
          <Field
            label="تاريخ الإنشاء"
            value={instructor.createdAt ? formatDateTime(instructor.createdAt) : null}
          />
          <Field
            label="تاريخ التعيين"
            value={instructor.hiredAt ? formatDate(instructor.hiredAt) : null}
          />
          <Field label="معرّف المدرب" value={instructor._id} />
          <Field label="معرّف المستخدم المرتبط" value={userId} />
        </dl>
      </div>
    </div>
  )
}
