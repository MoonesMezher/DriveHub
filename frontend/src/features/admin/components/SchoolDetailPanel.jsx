import { Button, StatusBadge } from '@/components/ui'
import { formatDateTime } from '@/lib/helpers/date'
import { SchoolManagerSection } from './SchoolManagerSection'

const schoolStatusLabels = {
  active: 'نشطة',
  suspended: 'موقوفة',
  deleted: 'محذوفة',
}

const schoolStatusVariants = {
  active: 'success',
  suspended: 'error',
  deleted: 'default',
}

const managerStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const managerStatusVariants = {
  active: 'success',
  suspended: 'error',
}

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-label-sm text-on-surface-variant">{label}</dt>
    <dd className="mt-0.5 break-words text-body-md text-on-surface">{value || '—'}</dd>
  </div>
)

const boolLabel = (value) => {
  if (value == null) return null
  return value ? 'نعم' : 'لا'
}

const managerFromSchool = (school) => {
  const manager = school?.managerId
  if (!manager) return null
  if (typeof manager === 'string') return { _id: manager }
  return manager
}

export const SchoolDetailPanel = ({
  school,
  onClose,
  onToggleStatus,
  onDelete,
  onManagerAssigned,
  statusPending = false,
  deletePending = false,
}) => {
  if (!school) return null

  const manager = managerFromSchool(school)
  const licenses = (school.licenses || []).join('، ')
  const isActive = school.status === 'active'
  const canToggleStatus = school.status === 'active' || school.status === 'suspended'
  const canDelete = school.status !== 'deleted'

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label-md font-medium text-on-surface">تفاصيل المدرسة</p>
        <div className="flex flex-wrap items-center gap-2">
          {canToggleStatus && typeof onToggleStatus === 'function' && (
            <Button
              size="sm"
              variant={isActive ? 'danger' : 'outline'}
              disabled={statusPending}
              onClick={() => onToggleStatus(school)}
            >
              {statusPending
                ? 'جاري التحديث…'
                : isActive
                  ? 'إيقاف المدرسة'
                  : 'إعادة تفعيل المدرسة'}
            </Button>
          )}
          {canDelete && typeof onDelete === 'function' && (
            <Button
              size="sm"
              variant="outline"
              disabled={deletePending}
              onClick={() => onDelete(school)}
            >
              {deletePending ? 'جاري الحذف…' : 'حذف'}
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
        <p className="text-label-md font-medium text-on-surface">بيانات المدرسة</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الاسم" value={school.name} />
          <Field label="المحافظة" value={school.governorate} />
          <Field label="العنوان" value={school.address} />
          <Field label="الوصف" value={school.description} />
          <div className="min-w-0">
            <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
            <dd className="mt-0.5">
              <StatusBadge
                status={school.status}
                labels={schoolStatusLabels}
                variants={schoolStatusVariants}
              />
            </dd>
          </div>
          <Field label="فئات الرخص" value={licenses} />
          <Field
            label="عدد المركبات"
            value={school.vehiclesCount != null ? String(school.vehiclesCount) : null}
          />
          <Field label="مدربات إناث" value={boolLabel(school.hasFemaleCoaches)} />
          <Field
            label="تاريخ التسجيل"
            value={school.createdAt ? formatDateTime(school.createdAt) : null}
          />
          <Field
            label="آخر تحديث"
            value={school.updatedAt ? formatDateTime(school.updatedAt) : null}
          />
          <Field label="معرّف المدرسة" value={school._id} />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">التواصل والموقع</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الهاتف" value={school.phone} />
          <Field label="البريد الإلكتروني" value={school.email} />
          <Field
            label="خط العرض"
            value={school.lat != null ? String(school.lat) : null}
          />
          <Field
            label="خط الطول"
            value={school.lng != null ? String(school.lng) : null}
          />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">التسجيل والامتثال</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="التسجيل المسبق مفعّل" value={boolLabel(school.preRegistrationEnabled)} />
          <Field label="التسجيل متوقف مؤقتاً" value={boolLabel(school.registrationPaused)} />
          <Field label="الحساب البنكي" value={school.bankAccount} />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">المدير / المالك</p>
        {manager ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="الاسم" value={manager.name} />
            <Field label="البريد الإلكتروني" value={manager.email} />
            <Field label="رقم الهاتف" value={manager.phone} />
            {manager.status && (
              <div className="min-w-0">
                <dt className="text-label-sm text-on-surface-variant">حالة الحساب</dt>
                <dd className="mt-0.5">
                  <StatusBadge
                    status={manager.status}
                    labels={managerStatusLabels}
                    variants={managerStatusVariants}
                  />
                </dd>
              </div>
            )}
            <Field label="معرّف المستخدم" value={manager._id || manager.id} />
          </dl>
        ) : (
          <p className="text-body-md text-on-surface-variant">لا يوجد مدير مرتبط بهذه المدرسة.</p>
        )}
        <SchoolManagerSection
          schoolId={school._id}
          hasManager={Boolean(manager)}
          onSuccess={onManagerAssigned}
        />
      </div>
    </div>
  )
}
