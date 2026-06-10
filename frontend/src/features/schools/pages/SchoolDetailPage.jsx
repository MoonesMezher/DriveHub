import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, Card, AsyncContent, Badge, Button, Icon, Input } from '@/components/ui'
import {
  schoolService,
  reviewService,
  preRegistrationService,
} from '@/lib/services'
import { unwrap, unwrapList } from '@/lib/helpers/api'
import { ROUTES } from '@/lib/constants/routes'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useAuthContext } from '@/app/providers/AuthProvider'

const resolveSchool = (data) => {
  if (!data || typeof data !== 'object') return null
  const candidate = data.school ?? (data._id ? data : null)
  return candidate && typeof candidate === 'object' ? candidate : null
}

const StarRating = ({ rating, onChange, interactive = false }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onChange?.(star)}
        className={interactive ? 'cursor-pointer' : 'cursor-default'}
      >
        <Icon
          name={star <= rating ? 'star' : 'star_border'}
          size={interactive ? 28 : 18}
          className={star <= rating ? 'text-warning' : 'text-outline'}
        />
      </button>
    ))}
  </div>
)

const SchoolDetailContent = ({
  school,
  schoolId,
  courses,
  reviews,
  avgRating,
  enrollParams,
  isAuthenticated,
  reviewForm,
  setReviewForm,
  onReview,
  onPreReg,
  reviewPending,
  preRegPending,
  coursesLoading,
  coursesError,
  reviewsLoading,
  reviewsError,
}) => (
  <div className="bento-grid">
    <Card className="col-span-12 lg:col-span-8" title="عن المدرسة">
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-body-md">
          <Icon name="location_on" size={20} className="mt-0.5 text-primary" />
          <span>
            {school.address ?? '—'}
            {school.governorate && ` — ${school.governorate}`}
          </span>
        </p>
        {school.phone && (
          <p className="flex items-center gap-2 text-body-md">
            <Icon name="phone" size={20} className="text-primary" />
            <span dir="ltr">{school.phone}</span>
          </p>
        )}
        {school.email && (
          <p className="flex items-center gap-2 text-body-md">
            <Icon name="alternate_email" size={20} className="text-primary" />
            <span>{school.email}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {school.licenses?.map((lic) => (
            <Badge key={lic} variant="primary">
              {lic}
            </Badge>
          ))}
          {school.hasFemaleCoaches && <Badge variant="secondary">مدربات إناث</Badge>}
          {school.vehiclesCount > 0 && (
            <Badge variant="default">{school.vehiclesCount} مركبة</Badge>
          )}
        </div>
      </div>
    </Card>

    <Card className="col-span-12 lg:col-span-4" title="التقييم">
      {avgRating ? (
        <div className="text-center">
          <p className="text-display-lg-mobile text-primary">{avgRating}</p>
          <StarRating rating={Math.round(Number(avgRating))} />
          <p className="mt-2 text-body-md text-on-surface-variant">
            {reviews.length} تقييم
          </p>
        </div>
      ) : (
        <p className="text-body-md text-on-surface-variant">لا توجد تقييمات بعد</p>
      )}
      <Link to={`${ROUTES.ENROLL}?${enrollParams.toString()}`} className="mt-4 block">
        <Button className="w-full">التقديم للاشتراك</Button>
      </Link>
      {isAuthenticated && school.preRegistrationEnabled && (
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={onPreReg}
          disabled={preRegPending}
        >
          حجز مسبق
        </Button>
      )}
    </Card>

    <Card className="col-span-12" title="الدورات المفتوحة">
      <AsyncContent
        isLoading={coursesLoading}
        error={coursesError}
        isEmpty={!courses.length}
        emptyIcon="school"
        emptyTitle="لا توجد دورات مفتوحة"
        emptyDescription="تواصل مع المدرسة أو جرّب لاحقاً."
      >
        {() => (
          <div className="grid gap-comfortable md:grid-cols-2">
            {courses.map((course) => {
              const params = new URLSearchParams({
                schoolId,
                courseId: course._id,
                categoryCode: course.categoryCode,
              })
              if (course.subTypeCode) params.set('subTypeCode', course.subTypeCode)
              return (
                <div
                  key={course._id}
                  className="rounded-lg border border-outline-variant p-comfortable"
                >
                  <p className="text-headline-sm text-primary">
                    فئة {course.categoryCode}
                    {course.subTypeCode ? ` — ${course.subTypeCode}` : ''}
                  </p>
                  <p className="mt-1 text-body-md text-on-surface-variant">
                    أماكن متبقية:{' '}
                    {Math.max(0, (course.maxStudents || 0) - (course.paidCount || 0))}
                  </p>
                  <Link to={`${ROUTES.ENROLL}?${params.toString()}`} className="mt-3 inline-block">
                    <Button size="sm">التقديم لهذه الدورة</Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </AsyncContent>
    </Card>

    {isAuthenticated && (
      <Card className="col-span-12" title="أضف تقييمك">
        <form onSubmit={onReview} className="space-y-comfortable">
          <div>
            <p className="mb-2 text-label-md text-on-surface">التقييم</p>
            <StarRating
              rating={reviewForm.rating}
              interactive
              onChange={(rating) => setReviewForm((f) => ({ ...f, rating }))}
            />
          </div>
          <Input
            label="تعليق (اختياري)"
            name="comment"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
          />
          <Button type="submit" disabled={reviewPending}>
            {reviewPending ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </Button>
        </form>
      </Card>
    )}

    <Card className="col-span-12" title="آراء الطلاب">
      <AsyncContent
        isLoading={reviewsLoading}
        error={reviewsError}
        isEmpty={!reviews.length}
        emptyIcon="rate_review"
        emptyTitle="لا توجد تقييمات"
        emptyDescription="كن أول من يقيّم هذه المدرسة بعد التسجيل."
      >
        {() => (
          <div className="divide-y divide-outline-variant">
            {reviews.map((review) => (
              <div key={review._id} className="py-comfortable first:pt-0 last:pb-0">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <StarRating rating={review.rating} />
                  <span className="text-label-sm text-on-surface-variant">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-body-md text-on-surface">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </AsyncContent>
    </Card>
  </div>
)

export const SchoolDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthContext()
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })

  const schoolQuery = useQuery({
    queryKey: ['schools', id],
    queryFn: async () => unwrap(await schoolService.getById(id)),
    enabled: Boolean(id),
  })

  const coursesQuery = useQuery({
    queryKey: ['schools', id, 'courses'],
    queryFn: async () => unwrapList(await schoolService.getCourses(id), ['courses']),
    enabled: Boolean(id),
  })

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'school', id],
    queryFn: async () => unwrap(await reviewService.listBySchool(id)),
    enabled: Boolean(id),
  })

  const reviewMutation = useMutation({
    mutationFn: (data) => reviewService.create(data),
    onSuccess: () => {
      toast.success('تم إرسال تقييمك — سيظهر بعد الموافقة')
      setReviewForm({ rating: 0, comment: '' })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'school', id] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const preRegMutation = useMutation({
    mutationFn: (data) => preRegistrationService.create(data),
    onSuccess: () => toast.success('تم الحجز المسبق بنجاح'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const school = resolveSchool(schoolQuery.data)
  const courses = coursesQuery.data ?? []
  const reviews = reviewsQuery.data?.reviews ?? []
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

  const defaultCategory = school?.licenses?.[0] || 'B'
  const enrollParams = new URLSearchParams({ schoolId: id, categoryCode: defaultCategory })
  if (courses[0]?._id) enrollParams.set('courseId', courses[0]._id)

  const handleReview = (e) => {
    e.preventDefault()
    if (!reviewForm.rating) {
      toast.error('يرجى اختيار تقييم')
      return
    }
    reviewMutation.mutate({
      schoolId: id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    })
  }

  const handlePreReg = () => {
    preRegMutation.mutate({
      schoolId: id,
      categoryCode: defaultCategory,
      subTypeCode: courses[0]?.subTypeCode || undefined,
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        title={school?.name || 'تفاصيل المدرسة'}
        description={school?.description || 'معلومات المدرسة والتقييمات'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.SCHOOLS_NEARBY}>
              <Button variant="outline" leftIcon={<Icon name="arrow_forward" size={18} />}>
                المدارس القريبة
              </Button>
            </Link>
            {school && (
              <Link to={`${ROUTES.ENROLL}?${enrollParams.toString()}`}>
                <Button>طلب اشتراك</Button>
              </Link>
            )}
          </div>
        }
        size="md"
      />

      <AsyncContent
        isLoading={schoolQuery.isPending}
        error={schoolQuery.error}
        isEmpty={!school}
        emptyIcon="domain"
        emptyTitle="المدرسة غير موجودة"
        emptyDescription="تعذّر العثور على هذه المدرسة."
      >
        {() =>
          school ? (
            <SchoolDetailContent
              school={school}
              schoolId={id}
              courses={courses}
              reviews={reviews}
              avgRating={avgRating}
              enrollParams={enrollParams}
              isAuthenticated={isAuthenticated}
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              onReview={handleReview}
              onPreReg={handlePreReg}
              reviewPending={reviewMutation.isPending}
              preRegPending={preRegMutation.isPending}
              coursesLoading={coursesQuery.isPending}
              coursesError={coursesQuery.error}
              reviewsLoading={reviewsQuery.isPending}
              reviewsError={reviewsQuery.error}
            />
          ) : null
        }
      </AsyncContent>
    </div>
  )
}
