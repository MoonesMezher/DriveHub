import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  PageHeader,
  Card,
  Button,
  Input,
  Badge,
  Icon,
  GovernorateSelect,
  FormSection,
  PageSection,
  EmptyState,
  Alert,
} from '@/components/ui'
import { schoolApplicationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'
import { cn } from '@/lib/cn'

const LICENSE_OPTIONS = ['A', 'B', 'C', 'D', 'E']

const STEPS = [
  { id: 1, label: 'بيانات المدرسة', icon: 'domain' },
  { id: 2, label: 'الموقع', icon: 'location_on' },
  { id: 3, label: 'التواصل', icon: 'contact_phone' },
  { id: 4, label: 'الرخص والإرسال', icon: 'badge' },
]

export const AddSchoolPage = () => {
  const { isAuthenticated } = useAuth()
  const [step, setStep] = useState(1)
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
      setStep(1)
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

  const canAdvance = () => {
    if (step === 1) return form.schoolName && form.address && form.governorate
    if (step === 2) return form.lat && form.lng
    if (step === 3) return form.phone && form.email
    return true
  }

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="space-y-loose">
        <PageHeader
          title="أضف مدرستك"
          description="انضم إلى شبكة DriveHub للمدارس المعتمدة"
        />
        <PageSection variant="contained">
          <EmptyState
            icon="lock"
            title="يلزم تسجيل الدخول"
            description="سجّل دخولك أو أنشئ حساباً لتقديم طلب انضمام مدرستك."
            variant="page"
          />
          <div className="mt-comfortable flex flex-wrap justify-center gap-3">
            <Link to={ROUTES.LOGIN} state={{ from: { pathname: ROUTES.ADD_SCHOOL } }}>
              <Button>تسجيل الدخول</Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button variant="outline">إنشاء حساب</Button>
            </Link>
          </div>
        </PageSection>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-loose">
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={PUBLIC_HERO_IMAGES.schools}
          alt="أضف مدرستك"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <PageHeader
            title="أضف مدرستك"
            description="قدّم طلب انضمام — يراجعه فريق DriveHub ويتواصل معك"
            className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
          />
        </div>
      </section>

      <PageSection variant="contained">
        <div className="mb-loose flex flex-wrap items-center justify-between gap-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                  step === s.id
                    ? 'bg-primary text-on-primary'
                    : step > s.id
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-surface-container text-on-surface-variant',
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-label-md font-bold">
                  {step > s.id ? <Icon name="check" size={16} /> : s.id}
                </span>
                <Icon name={s.icon} size={18} className="hidden sm:block" />
                <span className="text-label-md font-medium">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <Icon name="chevron_left" size={20} className="text-on-surface-variant" />
              )}
            </div>
          ))}
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <FormSection title="بيانات المدرسة" description="المعلومات الأساسية عن مدرستك">
                <div className="grid gap-comfortable md:grid-cols-2">
                  <Input
                    label="اسم المدرسة"
                    name="schoolName"
                    icon="domain"
                    value={form.schoolName}
                    onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    required
                  />
                  <GovernorateSelect
                    name="governorate"
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
                </div>
              </FormSection>
            )}

            {step === 2 && (
              <FormSection title="الموقع الجغرافي" description="إحداثيات المدرسة على الخريطة">
                {locating && (
                  <Alert variant="info">جاري تحديد موقعك تلقائياً...</Alert>
                )}
                <div className="grid gap-comfortable md:grid-cols-2">
                  <Input
                    label="خط العرض (lat)"
                    name="lat"
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    hint="يُملأ تلقائياً من موقعك"
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
                </div>
              </FormSection>
            )}

            {step === 3 && (
              <FormSection title="بيانات التواصل" description="للتواصل معك بعد مراجعة الطلب">
                <div className="grid gap-comfortable md:grid-cols-2">
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
                </div>
              </FormSection>
            )}

            {step === 4 && (
              <FormSection title="الرخص المدعومة" description="اختر فئات الرخص التي تقدّمها مدرستك">
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
                {form.licenses.length === 0 && (
                  <Alert variant="warning" className="mt-4">
                    اختر رخصة واحدة على الأقل قبل الإرسال.
                  </Alert>
                )}
              </FormSection>
            )}

            <div className="mt-loose flex flex-wrap gap-3">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                  السابق
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canAdvance()}
                >
                  التالي
                </Button>
              ) : (
                <Button type="submit" disabled={submitMutation.isPending || !form.licenses.length}>
                  {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </PageSection>
    </div>
  )
}
