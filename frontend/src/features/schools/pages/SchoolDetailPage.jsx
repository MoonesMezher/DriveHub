import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  PageHeader,
  Card,
  AsyncContent,
  Badge,
  Button,
  Icon,
  Input,
  Tabs,
  PageSection,
  SectionBlock,
} from '@/components/ui'
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
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'

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

const TAB_IDS = {
  ABOUT: 'about',
  COURSES: 'courses',
  REVIEWS: 'reviews',
}

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
}) => {
  const [activeTab, setActiveTab] = useState(TAB_IDS.ABOUT)

  const tabs = [
    { id: TAB_IDS.ABOUT, label: 'عن المدرسة' },
    { id: TAB_IDS.COURSES, label: 'الدورات' },
    { id: TAB_IDS.REVIEWS, label: 'التقييمات' },
  ]

  return (
    <div className="space-y-loose">
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={HOME_IMAGES.school}
          alt={school.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-display-lg-mobile text-white md:text-display-lg">{school.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-body-lg text-white/90">
                <Icon name="location_on" size={20} />
                {school.address ?? '—'}
                {school.governorate && ` — ${school.governorate}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {school.licenses?.map((lic) => (
                  <Badge key={lic} variant="secondary" className="bg-white/20 text-white backdrop-blur">
                    {lic}
                  </Badge>
                ))}
                {school.hasFemaleCoaches && (
                  <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
                    مدربات إناث
                  </Badge>
                )}
              </div>
            </div>
            {avgRating && (
              <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
                <p className="text-display-lg-mobile text-white">{avgRating}</p>
                <StarRating rating={Math.round(Number(avgRating))} />
                <p className="mt-1 text-label-sm text-white/80">{reviews.length} تقييم</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <PageSection variant="elevated" className="!p-0">
        <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
        <div className="p-loose">
          {activeTab === TAB_IDS.ABOUT && (
            <div className="grid gap-loose lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {school.description && (
                  <p className="text-body-lg text-on-surface">{school.description}</p>
                )}
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
                  {school.vehiclesCount > 0 && (
                    <Badge variant="default">{school.vehiclesCount} مركبة</Badge>
                  )}
                </div>
              </div>
              <Card title="التسجيل" className="h-fit">
                <Link to={`${ROUTES.ENROLL}?${enrollParams.toString()}`} className="block">
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
            </div>
          )}

          {activeTab === TAB_IDS.COURSES && (
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
                      <Card key={course._id} className="h-full">
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
                      </Card>
                    )
                  })}
                </div>
              )}
            </AsyncContent>
          )}

          {activeTab === TAB_IDS.REVIEWS && (
            <div className="space-y-loose">
              {isAuthenticated && (
                <SectionBlock title="أضف تقييمك">
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
                </SectionBlock>
              )}

              <SectionBlock title="آراء الطلاب">
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
              </SectionBlock>
            </div>
          )}
        </div>
      </PageSection>
    </div>
  )
}

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
    <div dir="rtl" className="space-y-loose">
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
        variant="compact"
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
