import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader, Card, Button, Input, Badge, Icon } from '@/components/ui'
import { schoolApplicationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'

const LICENSE_OPTIONS = ['A', 'B', 'C', 'D', 'E']

export const AddSchoolPage = () => {
  const { isAuthenticated } = useAuth()
  const [form, setForm] = useState({
    schoolName: '',
    address: '',
    governorate: '',
    lat: '',
    lng: '',
    phone: '',
    email: '',
    bankAccount: '',
    licenses: [],
  })
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        }))
        setLocating(false)
      },
      () => setLocating(false),
    )
  }, [])

  const submitMutation = useMutation({
    mutationFn: (data) => schoolApplicationService.submit(data),
    onSuccess: (res) => {
      toast.success(unwrap(res)?.message || 'تم إرسال طلب الانضمام')
      setForm({
        schoolName: '',
        address: '',
        governorate: '',
        lat: '',
        lng: '',
        phone: '',
        email: '',
        bankAccount: '',
        licenses: [],
      })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleLicense = (code) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.includes(code)
        ? prev.licenses.filter((l) => l !== code)
        : [...prev.licenses, code],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.licenses.length) {
      toast.error('اختر رخصة واحدة على الأقل')
      return
    }
    submitMutation.mutate({
      schoolName: form.schoolName,
      address: form.address,
      governorate: form.governorate || undefined,
      lat: Number(form.lat),
      lng: Number(form.lng),
      phone: form.phone,
      email: form.email,
      licenses: form.licenses,
      bankAccount: form.bankAccount || undefined,
    })
  }

  if (!isAuthenticated) {
    return (
      <div dir="rtl">
        <PageHeader
          title="أضف مدرستك"
          description="انضم إلى شبكة DriveHub للمدارس المعتمدة"
        />
        <Card className="text-center">
          <Icon name="lock" size={48} className="mx-auto mb-4 text-on-surface-variant" />
          <h3 className="text-headline-sm text-primary">يلزم تسجيل الدخول</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            سجّل دخولك أو أنشئ حساباً لتقديم طلب انضمام مدرستك.
          </p>
          <div className="mt-comfortable flex flex-wrap justify-center gap-3">
            <Link to={ROUTES.LOGIN} state={{ from: { pathname: ROUTES.ADD_SCHOOL } }}>
              <Button>تسجيل الدخول</Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="outline">إنشاء حساب</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="أضف مدرستك"
        description="قدّم طلب انضمام — يراجعه فريق DriveHub ويتواصل معك"
      />

      <Card title="بيانات المدرسة">
        <form onSubmit={handleSubmit} className="grid gap-comfortable md:grid-cols-2">
          <Input
            label="اسم المدرسة"
            name="schoolName"
            icon="domain"
            value={form.schoolName}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            required
          />
          <Input
            label="المحافظة"
            name="governorate"
            icon="map"
            value={form.governorate}
            onChange={(e) => setForm({ ...form, governorate: e.target.value })}
          />
          <Input
            label="العنوان"
            name="address"
            icon="location_on"
            wrapperClassName="md:col-span-2"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <Input
            label="خط العرض (lat)"
            name="lat"
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            hint={locating ? 'جاري تحديد الموقع...' : 'يُملأ تلقائياً من موقعك'}
            required
          />
          <Input
            label="خط الطول (lng)"
            name="lng"
            type="number"
            step="any"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
            required
          />
          <Input
            label="الهاتف"
            name="phone"
            icon="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            icon="alternate_email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="الحساب البنكي (اختياري)"
            name="bankAccount"
            icon="account_balance"
            wrapperClassName="md:col-span-2"
            value={form.bankAccount}
            onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
          />

          <div className="md:col-span-2">
            <p className="mb-3 text-label-md text-on-surface">الرخص المدعومة *</p>
            <div className="flex flex-wrap gap-2">
              {LICENSE_OPTIONS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleLicense(code)}
                  className="rounded-lg focus-ring"
                >
                  <Badge variant={form.licenses.includes(code) ? 'primary' : 'default'}>
                    {code}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
