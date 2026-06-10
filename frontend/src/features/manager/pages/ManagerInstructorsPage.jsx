import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, Card, Button, Input, AsyncContent, StatusBadge } from '@/components/ui'
import { managerService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

const instructorStatusLabels = {
  active: 'نشط',
  suspended: 'موقوف',
}

const instructorStatusVariants = {
  active: 'success',
  suspended: 'error',
}

export const ManagerInstructorsPage = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const schoolId = user?.activeContext?.schoolId

  const [form, setForm] = useState({
    userId: '',
    licenseCategories: '',
    gender: 'male',
    isFemaleCoach: false,
  })

  const instructorsQuery = useQuery({
    queryKey: ['manager', 'instructors'],
    queryFn: () => managerService.listInstructors().then(unwrap),
  })

  const instructors = instructorsQuery.data?.instructors ?? []

  const assignMutation = useMutation({
    mutationFn: (data) => managerService.assignInstructor(data).then(unwrap),
    onSuccess: () => {
      toast.success('تم تعيين المدرب')
      setForm({ userId: '', licenseCategories: '', gender: 'male', isFemaleCoach: false })
      queryClient.invalidateQueries({ queryKey: ['manager', 'instructors'] })
    },
    onError: (err) => toast.error(err, 'فشل تعيين المدرب'),
  })

  const handleAssign = (e) => {
    e.preventDefault()
    assignMutation.mutate({
      userId: form.userId.trim(),
      schoolId,
      licenseCategories: form.licenseCategories
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
      gender: form.gender,
      isFemaleCoach: form.isFemaleCoach,
    })
  }

  return (
    <div>
      <PageHeader title="المدربون" description="عرض المدربين وتعيين مدرب جديد للمدرسة" />

      <div className="grid gap-loose xl:grid-cols-[1fr_360px]">
        <Card title="قائمة المدربين">
          <AsyncContent
            isLoading={instructorsQuery.isLoading}
            error={instructorsQuery.error}
            isEmpty={instructors.length === 0}
            emptyTitle="لا يوجد مدربون"
          >
            {() => (
<div className="overflow-x-auto">
              <table className="w-full text-body-md">
                <thead>
                  <tr className="border-b border-outline-variant text-label-md text-on-surface-variant">
                    <th className="py-3 pe-4 text-start">الاسم</th>
                    <th className="py-3 pe-4 text-start">البريد</th>
                    <th className="py-3 pe-4 text-start">الفئات</th>
                    <th className="py-3 pe-4 text-start">الجنس</th>
                    <th className="py-3 pe-4 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {instructors.map((instructor) => (
                    <tr key={instructor._id} className="border-b border-outline-variant/50 last:border-0">
                      <td className="py-3 pe-4">{instructor.userId?.name || '—'}</td>
                      <td className="py-3 pe-4">{instructor.userId?.email || '—'}</td>
                      <td className="py-3 pe-4">
                        {(instructor.licenseCategories || []).join(', ') || '—'}
                      </td>
                      <td className="py-3 pe-4">
                        {instructor.gender === 'female' ? 'أنثى' : instructor.gender === 'male' ? 'ذكر' : '—'}
                      </td>
                      <td className="py-3 pe-4">
                        <StatusBadge
                          status={instructor.status}
                          labels={instructorStatusLabels}
                          variants={instructorStatusVariants}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            )}
          </AsyncContent>
        </Card>

        <Card title="تعيين مدرب">
          <form onSubmit={handleAssign} className="space-y-4">
            <Input
              label="معرّف المستخدم"
              name="userId"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              placeholder="MongoDB ObjectId"
              required
            />
            <Input
              label="فئات الرخص (مفصولة بفاصلة)"
              name="licenseCategories"
              value={form.licenseCategories}
              onChange={(e) => setForm((f) => ({ ...f, licenseCategories: e.target.value }))}
              placeholder="B, C"
              required
            />
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-label-md text-on-surface">
                الجنس
              </label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-body-md"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-body-md">
              <input
                type="checkbox"
                checked={form.isFemaleCoach}
                onChange={(e) => setForm((f) => ({ ...f, isFemaleCoach: e.target.checked }))}
                className="h-4 w-4 rounded border-outline-variant"
              />
              مدربة (للطلاب الإناث)
            </label>
            <Button type="submit" className="w-full" disabled={assignMutation.isPending}>
              تعيين
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
