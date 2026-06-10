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
} from '@/components/ui'
import { enrollmentService, schoolService } from '@/lib/services'
import { unwrap, unwrapList } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatDate, formatDateTime } from '@/lib/helpers/date'

const ENROLL_TABS = [
  { id: 'list', label: 'طلباتي' },
  { id: 'create', label: 'تقديم جديد' },
]

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
    mutationFn: (id) => enrollmentService.initiatePayment(id),
    onSuccess: (res) => {
      setPaymentInfo(unwrap(res))
      toast.success('تم تجهيز الدفع')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ id, amount, gatewayRef }) =>
      enrollmentService.confirmPayment(id, amount, gatewayRef),
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
  const courses = coursesQuery.data ?? []

  useEffect(() => {
    if (courses.length === 1 && !form.courseId) {
      setForm((prev) => ({ ...prev, courseId: courses[0]._id }))
    }
  }, [courses, form.courseId])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.courseId || !form.schoolId || !form.categoryCode) {
      toast.error('يرجى اختيار الدورة والمدرسة وفئة الرخصة')
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
    initiateMutation.mutate(enrollment._id)
  }

  const handleConfirmPayment = () => {
    if (!paymentTarget || !paymentInfo?.payment?.amount) return
    confirmMutation.mutate({
      id: paymentTarget._id,
      amount: paymentInfo.payment.amount,
      gatewayRef: `MOCK-${Date.now()}`,
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
                    <p className="text-headline-sm text-primary">تفاصيل الدفع</p>
                    <p className="mt-2 text-body-md">
                      المبلغ:{' '}
                      <span className="font-bold">{paymentInfo.payment?.amount} د.أ</span>
                    </p>
                    {paymentInfo.pricing?.fixedPrice && (
                      <p className="text-label-sm text-on-surface-variant">
                        السعر الأساسي: {paymentInfo.pricing.fixedPrice} د.أ
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
        <Card title="نموذج التقديم">
          <form onSubmit={handleCreate} className="grid gap-comfortable md:grid-cols-2">
            <Input
              label="معرّف المدرسة"
              name="schoolId"
              icon="domain"
              hint="من صفحة المدرسة أو المدارس القريبة"
              value={form.schoolId}
              onChange={(e) =>
                setForm({ ...form, schoolId: e.target.value, courseId: '' })
              }
              required
            />
            <Input
              label="فئة الرخصة"
              name="categoryCode"
              icon="badge"
              placeholder="مثال: B"
              value={form.categoryCode}
              onChange={(e) =>
                setForm({ ...form, categoryCode: e.target.value, courseId: '' })
              }
              required
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-label-md text-on-surface">الدورة المتاحة</label>
              {coursesQuery.isLoading ? (
                <p className="text-body-md text-on-surface-variant">جاري تحميل الدورات...</p>
              ) : courses.length ? (
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-body-md"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
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
              ) : form.schoolId ? (
                <Input
                  label=""
                  name="courseId"
                  hint="لا توجد دورات مفتوحة — أدخل معرّف الدورة يدوياً"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  required
                />
              ) : (
                <p className="text-body-md text-on-surface-variant">
                  أدخل معرّف المدرسة أولاً لعرض الدورات المتاحة
                </p>
              )}
            </div>

            <Input
              label="النوع الفرعي (اختياري)"
              name="subTypeCode"
              icon="category"
              placeholder="مثال: B1"
              value={form.subTypeCode}
              onChange={(e) => setForm({ ...form, subTypeCode: e.target.value })}
            />
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
      )}
    </div>
  )
}

const BadgeInline = ({ children }) => (
  <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-sm">
    {children}
  </span>
)
