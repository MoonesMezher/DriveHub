import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, Card, AsyncContent, Button, Input, Badge, Avatar, FormSection } from '@/components/ui'
import { profileService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { ROLE_LABELS } from '@/lib/constants/roles'
import { useAuth } from '@/hooks/useAuth'

const resolveProfile = (data) => {
  if (!data || typeof data !== 'object') return null
  const candidate = data.profile ?? data.user ?? (data.email ? data : null)
  return candidate && typeof candidate === 'object' ? candidate : null
}

const ProfileContent = ({ profile, activeRole, form, setForm, onSubmit, isSaving }) => (
  <div className="bento-grid">
    <Card className="col-span-12 md:col-span-4" padding="lg">
      <div className="flex flex-col items-center text-center md:items-start md:text-start">
        <Avatar
          name={profile.name}
          status="online"
          className="mb-comfortable [&>div]:h-20 [&>div]:w-20 [&>div]:rounded-2xl [&>div]:text-headline-md"
        />
        <h2 className="text-headline-sm text-primary">{profile.name || '—'}</h2>
        <p className="mt-1 text-body-md text-on-surface-variant">{profile.email ?? '—'}</p>
        <div className="mt-comfortable flex flex-wrap justify-center gap-2 md:justify-start">
          <Badge variant={profile.status === 'active' ? 'success' : 'error'}>
            {profile.status === 'active' ? 'نشط' : 'موقوف'}
          </Badge>
          {activeRole && (
            <Badge variant="primary">{ROLE_LABELS[activeRole] || activeRole}</Badge>
          )}
        </div>
      </div>

      <FormSection
        title="معلومات الحساب"
        description="بيانات ثابتة مرتبطة بحسابك"
        className="mt-loose"
      >
        <p className="text-body-md">
          <span className="text-on-surface-variant">البريد: </span>
          {profile.email ?? '—'}
        </p>
        {profile.phone && (
          <p className="text-body-md">
            <span className="text-on-surface-variant">الهاتف: </span>
            {profile.phone}
          </p>
        )}
      </FormSection>
    </Card>

    <Card className="col-span-12 md:col-span-8" padding="lg">
      <FormSection title="تعديل البيانات" description="حدّث معلوماتك — تُحفظ تلقائياً في طلباتك القادمة">
        <form onSubmit={onSubmit} className="grid gap-comfortable md:grid-cols-2">
          <Input
            label="الاسم الكامل"
            name="name"
            icon="person"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="رقم الهاتف"
            name="phone"
            icon="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="رقم الهوية"
            name="nationalId"
            icon="badge"
            value={form.nationalId}
            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
          />
          <Input
            label="تاريخ الميلاد"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
          />
          <Input
            label="العنوان"
            name="address"
            icon="home"
            wrapperClassName="md:col-span-2"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </FormSection>
    </Card>
  </div>
)

export const ProfilePage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const activeRole = user?.activeContext?.role
  const [form, setForm] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    dateOfBirth: '',
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => unwrap(await profileService.get()),
  })

  const profile = resolveProfile(profileQuery.data)

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '',
      phone: profile.phone || '',
      nationalId: profile.profileData?.nationalId || '',
      address: profile.profileData?.address || '',
      dateOfBirth: profile.profileData?.dateOfBirth || '',
    })
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data) => profileService.update(data),
    onSuccess: () => {
      toast.success('تم تحديث الملف الشخصي')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      name: form.name,
      phone: form.phone,
      profileData: {
        nationalId: form.nationalId || undefined,
        address: form.address || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      },
    })
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="الملف الشخصي"
        description="بيانات محفوظة — لا حاجة لإعادة إدخالها عند كل تقديم"
      />

      <AsyncContent
        isLoading={profileQuery.isPending}
        error={profileQuery.error}
        isEmpty={!profile}
        emptyIcon="person"
        emptyTitle="تعذّر تحميل الملف"
        emptyDescription="حاول تحديث الصفحة أو إعادة تسجيل الدخول."
      >
        {() =>
          profile ? (
            <ProfileContent
              profile={profile}
              activeRole={activeRole}
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              isSaving={updateMutation.isPending}
            />
          ) : null
        }
      </AsyncContent>
    </div>
  )
}
