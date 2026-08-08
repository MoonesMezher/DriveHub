import { Button, StatusBadge } from '@/components/ui'
import { COURSE_STATUS_LABELS } from '@/lib/constants/statusLabels'
import { formatDate, formatDateTime } from '@/lib/helpers/date'
import { formatCurrency } from '@/lib/helpers/format'

const courseStatusVariants = {
  registration_open: 'success',
  registration_closed: 'warning',
  launch_pending: 'warning',
  active: 'primary',
  completed: 'default',
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

const formatLicense = (course) => {
  if (!course?.categoryCode) return null
  return course.subTypeCode
    ? `${course.categoryCode} (${course.subTypeCode})`
    : course.categoryCode
}

const schoolName = (school) => {
  if (!school) return null
  if (typeof school === 'string') return school
  return school.name || null
}

const schoolIdValue = (school) => {
  if (!school) return null
  if (typeof school === 'string') return school
  return school._id || school.id || null
}

const previousCourseLabel = (prev) => {
  if (!prev) return null
  if (typeof prev === 'string') return prev
  const license = formatLicense(prev) || 'دورة سابقة'
  const launch = prev.launchDate ? ` — انطلقت ${formatDate(prev.launchDate)}` : ''
  return `${license}${launch}`
}

export const CourseDetailPanel = ({
  course,
  onClose,
  loading = false,
  onCloseRegistration,
  onLaunch,
  closePending = false,
  launchPending = false,
  canLaunch = true,
  launchHint = null,
}) => {
  if (!course && !loading) return null

  const instructors = Array.isArray(course?.instructors) ? course.instructors : []
  const pricing = course?.pricing
  const school = typeof course?.schoolId === 'object' ? course.schoolId : null

  return (
    <div dir="rtl" className="space-y-comfortable border-t border-outline-variant bg-surface-container-low/40 p-comfortable">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-label-md font-medium text-on-surface">تفاصيل الدورة</p>
        <div className="flex flex-wrap items-center gap-2">
          {course?.status === 'registration_open' && typeof onCloseRegistration === 'function' && (
            <Button
              size="sm"
              variant="outline"
              disabled={closePending}
              onClick={() => onCloseRegistration(course)}
            >
              {closePending ? 'جاري الإغلاق…' : 'إغلاق التسجيل'}
            </Button>
          )}
          {course?.status === 'registration_closed' && typeof onLaunch === 'function' && (
            <Button
              size="sm"
              disabled={launchPending || !canLaunch}
              onClick={() => onLaunch(course)}
            >
              {launchPending ? 'جاري الإطلاق…' : 'إطلاق الدورة'}
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              إغلاق
            </Button>
          )}
        </div>
      </div>

      {launchHint && (
        <p className="text-label-sm text-on-surface-variant">{launchHint}</p>
      )}

      {loading && !course ? (
        <p className="text-body-md text-on-surface-variant">جاري تحميل التفاصيل…</p>
      ) : (
        <>
          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">البيانات الأساسية</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="فئة الرخصة" value={formatLicense(course)} />
              <div className="min-w-0">
                <dt className="text-label-sm text-on-surface-variant">الحالة</dt>
                <dd className="mt-0.5">
                  <StatusBadge
                    status={course.status}
                    labels={COURSE_STATUS_LABELS}
                    variants={courseStatusVariants}
                  />
                </dd>
              </div>
              <Field
                label="التسجيل مفتوح"
                value={course.registrationOpen ? 'نعم' : 'لا'}
              />
              <Field label="المدرسة" value={schoolName(course.schoolId)} />
              <Field label="محافظة المدرسة" value={school?.governorate} />
              <Field label="عنوان المدرسة" value={school?.address} />
              <Field
                label="مركبات المدرسة"
                value={school?.vehiclesCount != null ? String(school.vehiclesCount) : null}
              />
              <Field label="معرّف الدورة" value={course._id} />
              <Field label="معرّف المدرسة" value={schoolIdValue(course.schoolId)} />
            </dl>
          </div>

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">السعة والانتظار</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="الحد الأقصى للطلاب"
                value={course.maxStudents != null ? String(course.maxStudents) : null}
              />
              <Field
                label="المقاعد المدفوعة"
                value={course.paidCount != null ? String(course.paidCount) : '0'}
              />
              <Field
                label="المقاعد المتبقية"
                value={course.seatsRemaining != null
                  ? String(course.seatsRemaining)
                  : (course.maxStudents != null
                    ? String(Math.max(0, course.maxStudents - (course.paidCount || 0)))
                    : null)}
              />
              <Field
                label="قائمة الانتظار"
                value={course.waitlistCount != null ? String(course.waitlistCount) : '0'}
              />
              <Field
                label="مهلة الدفع (أيام)"
                value={course.paymentDeadlineDays != null ? String(course.paymentDeadlineDays) : null}
              />
            </dl>
          </div>

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">التواريخ والمدة</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="تاريخ إغلاق التسجيل"
                value={course.registrationClosedAt ? formatDateTime(course.registrationClosedAt) : null}
              />
              <Field
                label="تاريخ الانطلاق"
                value={course.launchDate ? formatDate(course.launchDate) : null}
              />
              <Field
                label="تاريخ الانتهاء"
                value={course.endDate ? formatDate(course.endDate) : null}
              />
              <Field
                label="مدة الدورة (أيام)"
                value={course.durationDays != null ? String(course.durationDays) : null}
              />
              <Field
                label="أيام الإطلاق بعد الإغلاق"
                value={course.launchAfterCloseDays != null ? String(course.launchAfterCloseDays) : null}
              />
              <Field
                label="الدورة السابقة"
                value={previousCourseLabel(course.previousCourseId)}
              />
              <Field
                label="معرّف الدورة السابقة"
                value={
                  typeof course.previousCourseId === 'object'
                    ? (course.previousCourseId?._id || null)
                    : (course.previousCourseId || null)
                }
              />
              <Field
                label="تاريخ الإنشاء"
                value={course.createdAt ? formatDateTime(course.createdAt) : null}
              />
              <Field
                label="آخر تحديث"
                value={course.updatedAt ? formatDateTime(course.updatedAt) : null}
              />
            </dl>
          </div>

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">التسعير</p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="السعر الثابت"
                value={pricing?.fixedPrice != null
                  ? formatCurrency(pricing.fixedPrice, pricing.currency || 'SYP')
                  : null}
              />
              <Field label="العملة" value={pricing?.currency} />
              <Field
                label="فئة التسعير"
                value={pricing
                  ? (pricing.subTypeCode
                    ? `${pricing.categoryCode} (${pricing.subTypeCode})`
                    : pricing.categoryCode)
                  : null}
              />
              <Field
                label="ساري من"
                value={pricing?.effectiveFrom ? formatDate(pricing.effectiveFrom) : null}
              />
            </dl>
            {!pricing && (
              <p className="text-body-md text-on-surface-variant">لا يوجد تسعير نشط لهذه الفئة.</p>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
            <p className="text-label-md font-medium text-on-surface">
              المدربون المتوافقون ({instructors.length})
            </p>
            {instructors.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">
                لا يوجد مدربون نشطون لفئة هذه الدورة في المدرسة.
              </p>
            ) : (
              <ul className="space-y-2">
                {instructors.map((instructor) => {
                  const user = typeof instructor.userId === 'object' && instructor.userId
                    ? instructor.userId
                    : {}
                  const gender = instructor.gender || user.gender
                  return (
                    <li
                      key={instructor._id}
                      className="rounded-md border border-outline-variant/60 bg-surface px-3 py-2 text-body-md text-on-surface"
                    >
                      <div className="font-medium">{user.name || '—'}</div>
                      <div className="mt-0.5 text-label-sm text-on-surface-variant">
                        {[
                          user.email,
                          user.phone,
                          gender ? GENDER_LABELS[gender] || gender : null,
                          instructor.isFemaleCoach ? 'مدربة للطالبات' : null,
                          (instructor.licenseCategories || []).join('، ') || null,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
