import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  PageHeader,
  Card,
  AsyncContent,
  Button,
  Input,
  Tabs,
  StatusBadge,
  Icon,
  Alert,
} from '@/components/ui'
import { enrollmentService, schoolService, licenseService, profileService } from '@/lib/services'
import { unwrap, unwrapList } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatDate, formatDateTime } from '@/lib/helpers/date'
import { ROUTES } from '@/lib/constants/routes'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

const ENROLL_TABS = [
  { id: 'list', label: 'طلباتي' },
  { id: 'create', label: 'تقديم جديد' },
]

const ENROLL_STEPS = [
  { id: 'school', label: 'المدرسة', icon: 'domain' },
  { id: 'course', label: 'الدورة', icon: 'menu_book' },
  { id: 'confirm', label: 'التأكيد', icon: 'check_circle' },
]

const EnrollStepper = ({ form }) => {
  const activeIndex = !form.schoolId ? 0 : !form.categoryCode || !form.courseId ? 1 : 2

  return (
    <div className="mb-loose flex items-center justify-between gap-2">
      {ENROLL_STEPS.map((step, index) => {
        const completed = index < activeIndex
        const active = index === activeIndex
        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl border-2 transition-colors',
                  completed && 'border-success bg-success-container text-on-success-container',
                  active && 'border-primary bg-primary-container text-on-primary-container',
                  !completed && !active && 'border-outline-variant bg-surface-container text-on-surface-variant',
                )}
              >
                <Icon name={completed ? 'check' : step.icon} size={22} />
              </div>
              <span
                className={cn(
                  'text-label-sm',
                  active ? 'font-semibold text-primary' : 'text-on-surface-variant',
                )}
              >
                {step.label}
              </span>
            </div>
            {index < ENROLL_STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 flex-1 rounded-full',
                  index < activeIndex ? 'bg-success' : 'bg-outline-variant',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export const EnrollPage = () => {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState('list')
  const [form, setForm] = useState({
    courseId: '',
    schoolId: '',
    categoryCode: '',
    subTypeCode: '',
    prefersFemaleCoach: false,
  })
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState(null)

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      courseId: searchParams.get('courseId') || prev.courseId,
      schoolId: searchParams.get('schoolId') || prev.schoolId,
      categoryCode: searchParams.get('categoryCode') || prev.categoryCode,
    }))
    if (searchParams.get('schoolId') || searchParams.get('courseId')) {
      setTab('create')
    }
  }, [searchParams])

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => unwrap(await enrollmentService.list()),
  })

  const schoolsQuery = useQuery({
    queryKey: ['schools', 'nearby', 'enroll'],
    queryFn: async () =>
      unwrapList(await schoolService.getNearby({ lat: 33.5138, lng: 36.2765, radiusKm: 100 }), [
        'schools',
      ]),
  })

  const licensesQuery = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => unwrapList(await licenseService.list(), ['licenses']),
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => unwrap(await profileService.get()),
  })

  const missingDob = !profileQuery.data?.profile?.profileData?.dateOfBirth

  const coursesQuery = useQuery({
    queryKey: ['schools', form.schoolId, 'courses', form.categoryCode],
    queryFn: async () =>
      unwrapList(
        await schoolService.getCourses(form.schoolId, {
          category: form.categoryCode || undefined,
        }),
        ['courses'],
      ),
    enabled: Boolean(form.schoolId),
  })

  const createMutation = useMutation({
    mutationFn: (data) => enrollmentService.create(data),
    onSuccess: () => {
      toast.success('تم إرسال طلب الاشتراك')
      setForm({
        courseId: '',
        schoolId: '',
        categoryCode: '',
        subTypeCode: '',
        prefersFemaleCoach: false,
      })
      setTab('list')
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const initiateMutation = useMutation({
    mutationFn: ({ id, isRetake }) =>
      isRetake
        ? enrollmentService.initiateRetakePayment(id)
        : enrollmentService.initiatePayment(id),
    onSuccess: (res) => {
      setPaymentInfo(unwrap(res))
      toast.success('تم تجهيز الدفع')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ id, amount, gatewayRef, isRetake }) =>
      isRetake
        ? enrollmentService.confirmRetakePayment(id, amount, gatewayRef)
        : enrollmentService.confirmPayment(id, amount, gatewayRef),
    onSuccess: () => {
      toast.success('تم تأكيد الدفع بنجاح — أصبحت طالباً نشطاً')
      setPaymentTarget(null)
      setPaymentInfo(null)
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => enrollmentService.cancel(id),
    onSuccess: () => {
      toast.success('تم إلغاء الطلب')
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const enrollments = enrollmentsQuery.data?.enrollments ?? []
  const schools = schoolsQuery.data ?? []
  const licenses = licensesQuery.data ?? []
  const courses = coursesQuery.data ?? []

  useEffect(() => {
    if (courses.length === 1 && !form.courseId) {
      setForm((prev) => ({ ...prev, courseId: courses[0]._id }))
    }
  }, [courses, form.courseId])

  const selectedLicense = licenses.find((l) => l.code === form.categoryCode)
  const selectedCourse = courses.find((c) => c._id === form.courseId)
  const isBCategory = form.categoryCode?.toUpperCase() === 'B'
  const subTypeLocked = Boolean(selectedCourse?.subTypeCode)

  useEffect(() => {
    if (selectedCourse?.subTypeCode) {
      setForm((prev) => ({ ...prev, subTypeCode: selectedCourse.subTypeCode }))
    }
  }, [selectedCourse?.subTypeCode, selectedCourse?._id])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.courseId || !form.schoolId || !form.categoryCode) {
      toast.error('يرجى اختيار الدورة والمدرسة وفئة الرخصة')
      return
    }
    if (isBCategory && !form.subTypeCode && !selectedCourse?.subTypeCode) {
      toast.error('يرجى اختيار B1 (عادي) أو B2 (أوتوماتيك)')
      return
    }
    createMutation.mutate({
      courseId: form.courseId,
      schoolId: form.schoolId,
      categoryCode: form.categoryCode.toUpperCase(),
      subTypeCode: form.subTypeCode ? form.subTypeCode.toUpperCase() : undefined,
      prefersFemaleCoach: form.prefersFemaleCoach,
    })
  }

  const handleInitiatePayment = (enrollment) => {
    setPaymentTarget(enrollment)
    setPaymentInfo(null)
    const isRetake = (enrollment.retakeAttempt ?? 0) >= 1
    initiateMutation.mutate({ id: enrollment._id, isRetake })
  }

  const handleConfirmPayment = () => {
    if (!paymentTarget || !paymentInfo?.payment?.amount) return
    const isRetake = (paymentTarget.retakeAttempt ?? 0) >= 1
    confirmMutation.mutate({
      id: paymentTarget._id,
      amount: paymentInfo.payment.amount,
      gatewayRef: `MOCK-${Date.now()}`,
      isRetake,
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="طلب اشتراك"
        description="فئة واحدة — طلب معلّق واحد — قائمة انتظار ذكية"
      />

      <Tabs tabs={ENROLL_TABS} activeId={tab} onChange={setTab} className="mb-loose" />

      {tab === 'list' && (
        <AsyncContent
          isLoading={enrollmentsQuery.isLoading}
          error={enrollmentsQuery.error}
          isEmpty={!enrollments.length}
          emptyIcon="school"
          emptyTitle="لا توجد طلبات"
          emptyDescription="قدّم طلب اشتراك جديد للانضمام لدورة."
          emptyAction={{ label: 'تقديم جديد', onClick: () => setTab('create') }}
        >
          {() => (
          <div className="space-y-comfortable">
            {enrollments.map((enrollment) => (
              <Card key={enrollment._id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={enrollment.status} />
                      <BadgeInline>{enrollment.categoryCode}</BadgeInline>
                      {(enrollment.retakeAttempt ?? 0) >= 1 && (
                        <BadgeInline>إعادة #{enrollment.retakeAttempt}</BadgeInline>
                      )}
                    </div>
                    <p className="text-headline-sm text-primary">
                      {enrollment.schoolId?.name || 'مدرسة'}
                    </p>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      {enrollment.schoolId?.address}
                    </p>
                    <p className="mt-2 text-label-sm text-on-surface-variant">
                      تاريخ التقديم: {formatDate(enrollment.createdAt)}
                      {enrollment.paymentDeadline && (
                        <> — مهلة الدفع: {formatDateTime(enrollment.paymentDeadline)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {enrollment.status === 'awaiting_payment' && (
                      <Button
                        size="sm"
                        onClick={() => handleInitiatePayment(enrollment)}
                        disabled={initiateMutation.isPending}
                      >
                        <Icon name="payments" size={18} className="me-1" />
                        الدفع
                      </Button>
                    )}
                    {['submitted', 'under_review', 'accepted', 'awaiting_payment'].includes(
                      enrollment.status,
                    ) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelMutation.mutate(enrollment._id)}
                        disabled={cancelMutation.isPending}
                      >
                        إلغاء
                      </Button>
                    )}
                  </div>
                </div>

                {paymentTarget?._id === enrollment._id && paymentInfo && (
                  <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
                    <p className="text-headline-sm text-primary">
                      {(paymentTarget.retakeAttempt ?? 0) >= 1 ? 'تفاصيل دفع الإعادة' : 'تفاصيل الدفع'}
                    </p>
                    <p className="mt-2 text-body-md">
                      المبلغ:{' '}
                      <span className="font-bold">{paymentInfo.payment?.amount} د.أ</span>
                    </p>
                    {paymentInfo.breakdown?.percentage != null && (
                      <p className="text-label-sm text-on-surface-variant">
                        نسبة الدفع: {paymentInfo.breakdown.percentage}%
                        {(paymentTarget.retakeAttempt ?? 0) >= 1 && (
                          <> — محاولة {paymentTarget.retakeAttempt}</>
                        )}
                      </p>
                    )}
                    {paymentInfo.pricing?.fixedPrice && (
                      <p className="text-label-sm text-on-surface-variant">
                        السعر الأساسي: {paymentInfo.pricing.fixedPrice} د.أ
                      </p>
                    )}
                    {(paymentTarget.retakeScope || paymentInfo.payment?.retakePercentage) && (
                      <p className="text-label-sm text-on-surface-variant">
                        نطاق الإعادة: {paymentTarget.retakeScope === 'practical_only' ? 'عملي فقط' : 'شامل'}
                      </p>
                    )}
                    <Button
                      className="mt-4"
                      onClick={handleConfirmPayment}
                      disabled={confirmMutation.isPending}
                    >
                      {confirmMutation.isPending ? 'جاري التأكيد...' : 'تأكيد الدفع'}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
          )}
        </AsyncContent>
      )}

      {tab === 'create' && (
        <>
          {missingDob && (
            <Alert variant="warning" title="تاريخ الميلاد مطلوب" className="mb-loose">
              <p>يجب إكمال تاريخ الميلاد في ملفك الشخصي قبل التقديم — يُستخدم للتحقق من الحد الأدنى للعمر.</p>
              <Link to={ROUTES.PROFILE} className="mt-3 inline-block">
                <Button variant="outline" size="sm">الذهاب للملف الشخصي</Button>
              </Link>
            </Alert>
          )}

          <EnrollStepper form={form} />

          <Card title="نموذج التقديم">
            <form onSubmit={handleCreate} className="grid gap-comfortable md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="schoolId" className="block text-label-md text-on-surface">
                  المدرسة
                </label>
                <select
                  id="schoolId"
                  name="schoolId"
                  value={form.schoolId}
                  onChange={(e) =>
                    setForm({ ...form, schoolId: e.target.value, courseId: '' })
                  }
                  required
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
                >
                  <option value="">— اختر مدرسة —</option>
                  {schools.map((school) => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                      {school.governorate ? ` — ${school.governorate}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="categoryCode" className="block text-label-md text-on-surface">
                  فئة الرخصة
                </label>
                <select
                  id="categoryCode"
                  name="categoryCode"
                  value={form.categoryCode}
                  onChange={(e) =>
                    setForm({ ...form, categoryCode: e.target.value, courseId: '' })
                  }
                  required
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
                >
                  <option value="">— اختر فئة —</option>
                  {licenses.map((license) => (
                    <option key={license.code} value={license.code}>
                      {license.code} — {license.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-label-md text-on-surface">الدورة المتاحة</label>
                {coursesQuery.isLoading ? (
                  <p className="text-body-md text-on-surface-variant">جاري تحميل الدورات...</p>
                ) : courses.length ? (
                  <select
                    className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md"
                    value={form.courseId}
                    onChange={(e) => {
                      const course = courses.find((c) => c._id === e.target.value)
                      setForm({
                        ...form,
                        courseId: e.target.value,
                        subTypeCode: course?.subTypeCode || form.subTypeCode,
                      })
                    }}
                    required
                  >
                    <option value="">اختر دورة</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.categoryCode}
                        {course.subTypeCode ? ` (${course.subTypeCode})` : ''} — أماكن متبقية:{' '}
                        {Math.max(0, (course.maxStudents || 0) - (course.paidCount || 0))}
                      </option>
                    ))}
                  </select>
                ) : form.schoolId && form.categoryCode ? (
                  <p className="text-body-md text-on-surface-variant">
                    لا توجد دورات مفتوحة لهذه المدرسة والفئة حالياً
                  </p>
                ) : (
                  <p className="text-body-md text-on-surface-variant">
                    اختر المدرسة وفئة الرخصة لعرض الدورات المتاحة
                  </p>
                )}
              </div>

              {isBCategory ? (
                <div className="space-y-2">
                  <label htmlFor="subTypeCode" className="block text-label-md text-on-surface">
                    نوع التدريب (B1 / B2)
                  </label>
                  <select
                    id="subTypeCode"
                    value={form.subTypeCode}
                    onChange={(e) => setForm({ ...form, subTypeCode: e.target.value })}
                    disabled={subTypeLocked}
                    required
                    className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md disabled:opacity-60"
                  >
                    <option value="">— اختر النوع —</option>
                    {(selectedLicense?.subTypes ?? [
                      { code: 'B1', name: 'عادي (يدوي)' },
                      { code: 'B2', name: 'أوتوماتيك' },
                    ]).map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.code} — {sub.name}
                      </option>
                    ))}
                  </select>
                  {subTypeLocked && (
                    <p className="text-label-sm text-on-surface-variant">
                      النوع محدد من الدورة ولا يمكن تغييره
                    </p>
                  )}
                </div>
              ) : (
                <input type="hidden" name="subTypeCode" value={form.subTypeCode} />
              )}
              <label className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.prefersFemaleCoach}
                  onChange={(e) => setForm({ ...form, prefersFemaleCoach: e.target.checked })}
                  className="h-4 w-4 rounded border-outline-variant text-primary"
                />
                <span className="text-body-md">أفضّل مدربة أنثى</span>
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </div>
  )
}

const BadgeInline = ({ children }) => (
  <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm">
    {children}
  </span>
)
