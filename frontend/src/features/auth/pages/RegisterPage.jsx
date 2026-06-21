import { useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { resolvePostLoginRoute } from '@/lib/auth/authUtils'
import { Button, Input, PageHeader, Alert, FormSection, ProgressRing, Icon } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'
import { cn } from '@/lib/cn'

const PASSWORD_RULES = [
  { key: 'length', label: '8 أحرف على الأقل', test: (p) => p.length >= 8 },
  { key: 'case', label: 'حروف كبيرة وصغيرة', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { key: 'number', label: 'رقم واحد على الأقل', test: (p) => /\d/.test(p) },
  { key: 'special', label: 'رمز خاص', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export const RegisterPage = () => {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

  const formProgress = useMemo(() => {
    const fields = [
      form.name.trim().length >= 2,
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
      PASSWORD_RULES.every((rule) => rule.test(form.password)),
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [form])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const session = await register(form)
      const from = location.state?.from?.pathname
      navigate(from || session.homeRoute || resolvePostLoginRoute(session.user), { replace: true })
    } catch (err) {
      setError(err.message || 'فشل التسجيل')
    }
  }

  return (
    <div dir="rtl" className="p-comfortable md:p-loose">
      <PageHeader
        variant="compact"
        title="إنشاء حساب طالب"
        description="سجّل للوصول للعينة الكاملة والتقديم على المدارس."
        className="mb-loose"
      />

      <div className="mb-loose rounded-xl border border-outline-variant bg-surface-container-low p-comfortable">
        <ProgressRing
          value={formProgress}
          label="اكتمال النموذج"
          sublabel={formProgress === 100 ? 'جاهز للإرسال' : `${formProgress}% مكتمل`}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-loose">
        {error && (
          <Alert variant="error" title="تعذّر التسجيل">
            {error}
          </Alert>
        )}

        <FormSection title="معلوماتك الشخصية" description="بيانات التواصل الأساسية">
          <Input
            label="الاسم الكامل"
            name="name"
            icon="person"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            label="رقم الهاتف"
            name="phone"
            icon="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </FormSection>

        <FormSection title="كلمة المرور" description="اختر كلمة مرور قوية لحماية حسابك">
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            icon="lock"
            iconPosition="start"
            showPasswordToggle
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(form.password)
              return (
                <li
                  key={rule.key}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-label-sm transition-colors',
                    passed
                      ? 'bg-success-container text-on-success-container'
                      : 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  <Icon
                    name={passed ? 'check_circle' : 'radio_button_unchecked'}
                    size={18}
                    className={passed ? 'text-success' : 'text-outline-variant'}
                  />
                  {rule.label}
                </li>
              )
            })}
          </ul>
        </FormSection>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
        </Button>
      </form>

      <p className="mt-comfortable text-center text-label-md text-on-surface-variant">
        لديك حساب؟{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
