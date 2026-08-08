import { Button, Input, StatusBadge } from '@/components/ui'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { formatDate, formatDateTime } from '@/lib/helpers/date'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'

const userStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const userStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const roleStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const roleStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const GENDER_LABELS = {
  male: 'ذكر',
  female: 'أنثى',
  ذكر: 'ذكر',
  أنثى: 'أنثى',
}

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-label-sm text-on-surface-variant">{label}</dt>
    <dd className="mt-0.5 break-words text-body-md text-on-surface">{value || '—'}</dd>
  </div>
)

const formatGender = (gender) => {
  if (!gender) return null
  return GENDER_LABELS[String(gender).toLowerCase()] || GENDER_LABELS[gender] || gender
}

/** Resolve display name from populated school ref, schoolName, or nested shape. */
const schoolLabel = (schoolRef, fallbackName) => {
  if (fallbackName) return fallbackName
  if (!schoolRef) return null
  if (typeof schoolRef === 'object') {
    return schoolRef.name || schoolRef.schoolName || null
  }
  return null
}

const schoolIdValue = (schoolRef) => {
  if (!schoolRef) return null
  if (typeof schoolRef === 'string') return schoolRef
  return schoolRef._id || schoolRef.id || null
}

/** School name as primary value; technical id only as secondary under معرّف. */
const SchoolField = ({ label, schoolRef, schoolName }) => {
  const name = schoolLabel(schoolRef, schoolName)
  const id = schoolIdValue(schoolRef)
  const primary = name || (id ? 'غير معروفة' : null)
  return (
    <div className="min-w-0">
      <dt className="text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 break-words text-body-md text-on-surface">{primary || '—'}</dd>
      {id && (
        <dd className="mt-0.5 break-all font-mono text-label-sm text-on-surface-variant">
          معرّف: {id}
        </dd>
      )}
    </div>
  )
}

export const UserDetailPanel = ({
  user,
  onClose,
  onToggleStatus,
  statusPending = false,
  showWalletForm = false,
  onToggleWalletForm,
  walletForm,
  onWalletFormChange,
  onCreditWallet,
  walletCreditPending = false,
  walletBalance,
  walletTransactions = [],
}) => {
  if (!user) return null

  const profile = user.profileData || {}
  const genderLabel = formatGender(profile.gender)
  const photoUrl = resolveMediaUrl(profile.avatar || profile.photo)
  const isActive = user.status === 'active'
  const roles = Array.isArray(user.roles) ? user.roles : []
  const balance = walletBalance ?? user.walletBalance ?? 0

  return (
    <div dir="rtl" className="min-w-0 space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 truncate text-label-md font-medium text-on-surface">
          تفاصيل المستخدم
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {typeof onToggleWalletForm === 'function' && (
            <Button size="sm" variant="outline" onClick={onToggleWalletForm}>
              {showWalletForm ? 'إخفاء الشحن' : 'شحن رصيد'}
            </Button>
          )}
          {typeof onToggleStatus === 'function' && (
            <Button
              size="sm"
              variant={isActive ? 'danger' : 'outline'}
              disabled={statusPending}
              onClick={() => onToggleStatus(user)}
            >
              {statusPending
                ? 'جاري التحديث…'
                : isActive
                  ? 'إيقاف المستخدم'
                  : 'إعادة تفعيل المستخدم'}
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </div>
      </div>

      {showWalletForm && (
        <div className="min-w-0 space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
          <p className="text-label-md font-medium text-on-surface">شحن الرصيد</p>
          <p className="text-body-md text-on-surface-variant">
            الرصيد الحالي:{' '}
            <span className="font-bold text-primary">{balance} د.أ</span>
          </p>
          <form onSubmit={onCreditWallet} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Input
              label="المبلغ (د.أ)"
              type="number"
              min="1"
              value={walletForm?.amount ?? ''}
              onChange={(e) => onWalletFormChange?.({ amount: e.target.value })}
              required
            />
            <Input
              label="ملاحظة أو مرجع إيصال"
              value={walletForm?.note ?? ''}
              onChange={(e) => onWalletFormChange?.({ note: e.target.value })}
              placeholder="رقم إيصال أو ملاحظة"
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit" variant="ultra" disabled={walletCreditPending}>
                إضافة الرصيد
              </Button>
            </div>
          </form>
          {walletTransactions.length > 0 && (
            <div className="min-w-0 border-t border-outline-variant pt-4">
              <p className="mb-2 text-label-sm font-medium text-on-surface">آخر المعاملات</p>
              <ul className="space-y-2 text-label-sm text-on-surface-variant">
                {walletTransactions.slice(0, 5).map((tx) => (
                  <li key={tx._id} className="flex min-w-0 justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {tx.type === 'admin_credit'
                        ? 'شحن إداري'
                        : tx.type === 'enrollment_payment'
                          ? 'دفع اشتراك'
                          : tx.type}
                    </span>
                    <span className="shrink-0 whitespace-nowrap">
                      {tx.amount} د.أ — {formatDate(tx.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">بيانات الحساب</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الاسم" value={user.name} />
          <Field label="البريد الإلكتروني" value={user.email} />
          <Field label="رقم الهاتف" value={user.phone} />
          <div className="min-w-0">
            <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
            <dd className="mt-0.5">
              <StatusBadge
                status={user.status}
                labels={userStatusLabels}
                variants={userStatusVariants}
              />
            </dd>
          </div>
          <Field label="رصيد المحفظة" value={`${balance} د.أ`} />
          <Field
            label="تاريخ التسجيل"
            value={user.createdAt ? formatDateTime(user.createdAt) : null}
          />
          <Field
            label="آخر تحديث"
            value={user.updatedAt ? formatDateTime(user.updatedAt) : null}
          />
          <Field label="معرّف المستخدم" value={user._id} />
        </dl>
      </div>

      <div className="min-w-0 space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">الملف الشخصي</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="تاريخ الميلاد"
            value={profile.dateOfBirth || profile.dob
              ? formatDate(profile.dateOfBirth || profile.dob)
              : null}
          />
          <Field
            label="رقم الهوية"
            value={profile.nationalId || profile.nationalID || profile.national_id}
          />
          {genderLabel && <Field label="الجنس" value={genderLabel} />}
          <Field label="العنوان" value={profile.address} />
          <div className="min-w-0 sm:col-span-2 lg:col-span-3">
            <dt className="text-label-sm text-on-surface-variant">الصورة الشخصية</dt>
            <dd className="mt-1">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={user.name || 'صورة المستخدم'}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <span className="text-body-md text-on-surface">—</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="min-w-0 space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">الأدوار والسياق</p>
        {roles.length > 0 ? (
          <div className="space-y-3">
            {roles.map((role) => (
              <dl
                key={role._id || `${role.role}-${schoolIdValue(role.schoolId)}`}
                className="grid grid-cols-1 gap-3 rounded-md border border-outline-variant/60 p-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                <Field label="الدور" value={ROLE_LABELS[role.role] || role.role} />
                <div className="min-w-0">
                  <dt className="text-label-sm text-on-surface-variant">حالة الدور</dt>
                  <dd className="mt-0.5">
                    <StatusBadge
                      status={role.status || 'active'}
                      labels={roleStatusLabels}
                      variants={roleStatusVariants}
                    />
                  </dd>
                </div>
                <SchoolField
                  label="المدرسة"
                  schoolRef={role.schoolId}
                  schoolName={role.schoolName}
                />
                <Field label="معرّف الدور" value={role._id} />
                {(role.licenseCategories || []).length > 0 && (
                  <Field
                    label="فئات الرخص"
                    value={(role.licenseCategories || []).join('، ')}
                  />
                )}
              </dl>
            ))}
          </div>
        ) : (
          <p className="text-body-md text-on-surface-variant">لا توجد أدوار مسجّلة لهذا المستخدم.</p>
        )}
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="السياق النشط"
            value={
              user.activeContext?.role
                ? (ROLE_LABELS[user.activeContext.role] || user.activeContext.role)
                : null
            }
          />
          <SchoolField
            label="مدرسة السياق النشط"
            schoolRef={user.activeContext?.schoolId}
            schoolName={user.activeContext?.schoolName}
          />
        </dl>
      </div>
    </div>
  )
}
