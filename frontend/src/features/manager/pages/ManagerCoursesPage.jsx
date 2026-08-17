import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PageHeader, Card, Button, Input, DataTable, Pagination, SkeletonTable,
  Alert, FormSection, SearchInput, StatusBadge, LicenseCategorySelect,
} from '@/components/ui'
import { managerService, schoolService } from '@/lib/services'
import { computeMaxStudentsFromVehicles, STUDENTS_PER_VEHICLE } from '@/lib/constants/courseCapacity'
import { unwrap } from '@/lib/helpers/api'
import { formatDate } from '@/lib/helpers/date'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { COURSE_STATUS_LABELS } from '@/lib/constants/statusLabels'
import { CourseDetailPanel } from '../components/CourseDetailPanel'

const courseStatusLabels = COURSE_STATUS_LABELS
const LAUNCH_GAP_DAYS = 15
const PAGE_SIZE = 10

const daysSince = (date) => {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const getLastLaunchDate = (courses, excludeId) =>
  courses
    .filter((c) => c._id !== excludeId && c.launchDate)
    .map((c) => new Date(c.launchDate))
    .sort((a, b) => b - a)[0] || null

export const ManagerCoursesPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [form, setForm] = useState({
    categoryCode: '',
    subTypeCode: '',
    maxStudents: '30',
    paymentDeadlineDays: '3',
  })

  const coursesQuery = useQuery({
    queryKey: ['manager', 'courses'],
    queryFn: () => managerService.listCourses().then(unwrap),
  })

  const schoolQuery = useQuery({
    queryKey: ['manager', 'school', schoolId],
    queryFn: () => schoolService.getById(schoolId).then(unwrap),
    enabled: Boolean(schoolId),
  })

  const suggestedMax = computeMaxStudentsFromVehicles(
    schoolQuery.data?.school?.vehiclesCount ?? schoolQuery.data?.vehiclesCount,
  )

  const courses = coursesQuery.data?.courses ?? []

  const courseDetailQuery = useQuery({
    queryKey: ['manager', 'courses', selectedCourseId],
    queryFn: () => managerService.getCourse(selectedCourseId).then(unwrap),
    enabled: Boolean(selectedCourseId),
  })

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.categoryCode?.toLowerCase().includes(q)
        || c.subTypeCode?.toLowerCase().includes(q)
        || courseStatusLabels[c.status]?.includes(q),
    )
  }, [courses, search])

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))
  const paginatedCourses = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedFromList = useMemo(
    () => courses.find((c) => c._id === selectedCourseId) || null,
    [courses, selectedCourseId],
  )

  const selectedCourse = courseDetailQuery.data?.course || selectedFromList

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['manager', 'courses'] })
  }

  const createMutation = useMutation({
    mutationFn: (data) => managerService.createCourse(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم إنشاء الدورة بنجاح')
      setForm({ categoryCode: '', subTypeCode: '', maxStudents: '30', paymentDeadlineDays: '3' })
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إنشاء الدورة'),
  })

  const closeMutation = useMutation({
    mutationFn: (id) => managerService.closeCourse(id).then(unwrap),
    onSuccess: () => {
      toast.success('تم إغلاق التسجيل')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إغلاق التسجيل'),
  })

  const launchMutation = useMutation({
    mutationFn: ({ id, previousLaunchDate }) =>
      managerService.launchCourse(id, previousLaunchDate).then(unwrap),
    onSuccess: () => {
      toast.success('تم إطلاق الدورة')
      invalidate()
    },
    onError: (err) => toast.error(err, 'فشل إطلاق الدورة'),
  })

  const getLaunchInfo = (course) => {
    const lastLaunch = getLastLaunchDate(courses, course._id)
    const gapOk = !lastLaunch || daysSince(lastLaunch) >= LAUNCH_GAP_DAYS
    const daysRemaining = lastLaunch
      ? Math.max(0, LAUNCH_GAP_DAYS - daysSince(lastLaunch))
      : 0
    return {
      canLaunch: gapOk,
      daysRemaining,
      lastLaunch,
    }
  }

  const handleLaunch = (course) => {
    const { lastLaunch } = getLaunchInfo(course)
    launchMutation.mutate({
      id: course._id,
      previousLaunchDate: lastLaunch ? lastLaunch.toISOString() : undefined,
    })
  }

  const handleCreate = (e) => {
    e.preventDefault()
    const payload = {
      schoolId,
      categoryCode: form.categoryCode.trim().toUpperCase(),
      subTypeCode: form.subTypeCode.trim() || undefined,
      paymentDeadlineDays: Number(form.paymentDeadlineDays),
    }
    const maxVal = Number(form.maxStudents)
    if (maxVal > 0) payload.maxStudents = maxVal
    createMutation.mutate(payload)
  }

  const toggleCourse = (course) => {
    setSelectedCourseId((current) => (current === course._id ? null : course._id))
  }

  const selectedLaunchInfo = selectedCourse ? getLaunchInfo(selectedCourse) : null
  const selectedLaunchHint = selectedLaunchInfo?.lastLaunch && !selectedLaunchInfo.canLaunch && selectedLaunchInfo.daysRemaining > 0
    ? `متبقي ${selectedLaunchInfo.daysRemaining} يوم على اكتمال مهلة الـ 15 يوماً من آخر إطلاق`
    : null

  const columns = [
    {
      key: 'category',
      label: 'الفئة',
      render: (course) =>
        `${course.categoryCode}${course.subTypeCode ? ` (${course.subTypeCode})` : ''}`,
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (course) => (
        <StatusBadge
          status={course.status}
          labels={courseStatusLabels}
          variants={{
            registration_open: 'success',
            registration_closed: 'warning',
            active: 'primary',
            completed: 'default',
          }}
        />
      ),
    },
    {
      key: 'students',
      label: 'الطلاب',
      render: (course) => `${course.paidCount ?? 0} / ${course.maxStudents}`,
    },
    {
      key: 'launchDate',
      label: 'تاريخ الانطلاق',
      render: (course) => formatDate(course.launchDate) || '—',
    },
    {
      key: 'actions',
      label: 'إجراءات',
      render: (course) => {
        const launchInfo = getLaunchInfo(course)
        return (
          <div className="flex flex-wrap gap-2">
            {course.status === 'registration_open' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => closeMutation.mutate(course._id)}
                disabled={closeMutation.isPending}
              >
                إغلاق التسجيل
              </Button>
            )}
            {course.status === 'registration_closed' && (
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={() => handleLaunch(course)}
                  disabled={launchMutation.isPending || !launchInfo.canLaunch}
                >
                  إطلاق الدورة
                </Button>
                {launchInfo.lastLaunch && !launchInfo.canLaunch && launchInfo.daysRemaining > 0 && (
                  <span className="text-label-sm text-on-surface-variant">
                    متبقي {launchInfo.daysRemaining} يوم على اكتمال مهلة الـ 15 يوماً من آخر إطلاق
                  </span>
                )}
              </div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="إدارة الدورات"
        description="إنشاء دورات جديدة وإغلاق التسجيل أو الإطلاق — اضغط على صف لعرض التفاصيل الكاملة"
      />

      <div className="mb-comfortable">
        <SearchInput
          placeholder="بحث بالفئة أو الحالة..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="grid gap-loose xl:grid-cols-[1fr_380px]">
        <Card title="الدورات الحالية" padding="none">
          {coursesQuery.isLoading ? (
            <div className="p-comfortable"><SkeletonTable rows={5} cols={5} /></div>
          ) : coursesQuery.error ? (
            <div className="p-comfortable">
              <Alert variant="error" title="حدث خطأ">{getErrorMessage(coursesQuery.error)}</Alert>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={paginatedCourses}
                emptyLabel="لا توجد دورات"
                emptyPreset="no-data"
                onRowClick={toggleCourse}
                rowClassName={(row) => (
                  selectedCourseId === row._id
                    ? 'bg-primary-container/30 hover:bg-primary-container/40'
                    : undefined
                )}
              />
              <div className="border-t border-outline-variant/50 p-comfortable">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
              {selectedCourseId && courseDetailQuery.isError && !selectedFromList && (
                <div className="p-comfortable">
                  <Alert variant="error" title="تعذر تحميل التفاصيل">
                    {getErrorMessage(courseDetailQuery.error)}
                  </Alert>
                </div>
              )}
              {(selectedCourse || (selectedCourseId && courseDetailQuery.isLoading)) && (
                <CourseDetailPanel
                  course={selectedCourse}
                  loading={courseDetailQuery.isLoading && !selectedFromList}
                  onClose={() => setSelectedCourseId(null)}
                  closePending={closeMutation.isPending}
                  launchPending={launchMutation.isPending}
                  canLaunch={selectedLaunchInfo?.canLaunch ?? true}
                  launchHint={selectedLaunchHint}
                  onCloseRegistration={(course) => closeMutation.mutate(course._id)}
                  onLaunch={handleLaunch}
                />
              )}
            </>
          )}
        </Card>

        <Card title="دورة جديدة" className="xl:sticky xl:top-24 xl:self-start">
          <form onSubmit={handleCreate}>
            <FormSection description="أنشئ دورة جديدة لبدء استقبال طلبات الالتحاق في أي وقت — مهلة 15 يوماً تُطبَّق عند الإطلاق فقط">
              <LicenseCategorySelect
                value={form.categoryCode}
                onChange={(e) => setForm((f) => ({ ...f, categoryCode: e.target.value }))}
                required
              />
              <Input
                label="النوع الفرعي (اختياري — مثل B1 أو B2)"
                name="subTypeCode"
                value={form.subTypeCode}
                onChange={(e) => setForm((f) => ({ ...f, subTypeCode: e.target.value }))}
              />
              <Input
                label="الحد الأقصى للطلاب"
                name="maxStudents"
                type="number"
                min={1}
                max={500}
                value={form.maxStudents}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))}
                hint={
                  suggestedMax
                    ? `مقترح: ${suggestedMax} (${schoolQuery.data?.school?.vehiclesCount} مركبة × ${STUDENTS_PER_VEHICLE}) — اتركه فارغاً لاستخدام المقترح`
                    : `افتراضي: مركبات المدرسة × ${STUDENTS_PER_VEHICLE}`
                }
              />
              <Input
                label="مهلة الدفع (أيام)"
                name="paymentDeadlineDays"
                type="number"
                min={1}
                max={14}
                value={form.paymentDeadlineDays}
                onChange={(e) => setForm((f) => ({ ...f, paymentDeadlineDays: e.target.value }))}
                hint="يحددها المدير عند قبول الطلب (مثال 2–3 أيام)"
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                إنشاء الدورة
              </Button>
            </FormSection>
          </form>
        </Card>
      </div>
    </div>
  )
}
