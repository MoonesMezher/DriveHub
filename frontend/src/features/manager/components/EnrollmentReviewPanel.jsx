import { StatusBadge } from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/helpers/date'
import { ENROLLMENT_STATUS_LABELS } from '@/lib/constants/statusLabels'
import { EnrollmentDocumentsPanel } from './EnrollmentDocumentsPanel'

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

const formatLicense = (enrollment) => {
  const category = enrollment?.categoryCode || enrollment?.courseId?.categoryCode
  const subType = enrollment?.subTypeCode || enrollment?.courseId?.subTypeCode
  if (!category) return '—'
  return subType ? `${category} (${subType})` : category
}

const formatGender = (gender) => {
  if (!gender) return null
  return GENDER_LABELS[String(gender).toLowerCase()] || GENDER_LABELS[gender] || gender
}

export const EnrollmentReviewPanel = ({ enrollment, onClose }) => {
  if (!enrollment) return null

  const user = enrollment.userId || {}
  const profile = user.profileData || {}
  const school = enrollment.schoolId || {}
  const course = enrollment.courseId || {}
  const genderLabel = formatGender(profile.gender)

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">بيانات المتقدم</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الاسم" value={user.name} />
          <Field label="البريد الإلكتروني" value={user.email} />
          <Field label="رقم الهاتف" value={user.phone} />
          <Field label="رقم الهوية" value={profile.nationalId || profile.nationalID || profile.national_id} />
          <Field label="تاريخ الميلاد" value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null} />
          {genderLabel && <Field label="الجنس" value={genderLabel} />}
          <Field label="العنوان" value={profile.address} />
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
        <p className="text-label-md font-medium text-on-surface">معلومات الطلب والدورة</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="فئة الرخصة" value={formatLicense(enrollment)} />
          <div className="min-w-0">
            <dt className="text-label-sm text-on-surface-variant">حالة الطلب</dt>
            <dd className="mt-0.5">
              <StatusBadge status={enrollment.status} labels={ENROLLMENT_STATUS_LABELS} />
            </dd>
          </div>
          <Field label="تاريخ التقديم" value={enrollment.createdAt ? formatDateTime(enrollment.createdAt) : null} />
          <Field
            label="مهلة الدفع"
            value={enrollment.paymentDeadline ? formatDateTime(enrollment.paymentDeadline) : '—'}
          />
          <Field label="المدرسة" value={school.name} />
          <Field
            label="عنوان المدرسة"
            value={[school.address, school.governorate].filter(Boolean).join(' — ') || null}
          />
          <Field
            label="موعد انطلاق الدورة"
            value={course.launchDate ? formatDate(course.launchDate) : null}
          />
          <Field
            label="تفضيل مدربة"
            value={enrollment.prefersFemaleCoach ? 'نعم' : 'لا'}
          />
          {enrollment.pendingPayment?.amount != null && (
            <Field label="مبلغ الدفع" value={`${enrollment.pendingPayment.amount} د.أ`} />
          )}
          {enrollment.pendingPayment?.studentReference && (
            <Field label="مرجع الطالب" value={enrollment.pendingPayment.studentReference} />
          )}
          {enrollment.pendingPayment?.studentClaimedAt && (
            <Field
              label="إعلام الطالب بالدفع"
              value={formatDateTime(enrollment.pendingPayment.studentClaimedAt)}
            />
          )}
        </dl>
      </div>

      <EnrollmentDocumentsPanel enrollmentId={enrollment._id} onClose={onClose} />
    </div>
  )
}
