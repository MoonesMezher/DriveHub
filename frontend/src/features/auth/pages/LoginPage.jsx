import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Input, Tabs, PageHeader, Alert, Icon } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'
import { resolvePostLoginRoute } from '@/lib/auth/authUtils'
import { TRUST_BADGES } from '@/lib/constants/homeVisuals'

const LOGIN_TABS = [
  { id: 'student', label: 'دخول الطلاب' },
  { id: 'school', label: 'المدارس/المدربين' },
  { id: 'admin', label: 'الإدارة' },
]

const TAB_COPY = {
  student: { title: 'مرحباً بك مجدداً', desc: 'سجّل دخولك للوصول إلى دروسك ومتابعة تقدمك.' },
  school: { title: 'بوابة المدرسة', desc: 'إدارة الدورات والطلاب والمدربين.' },
  admin: { title: 'لوحة الإدارة', desc: 'إدارة المنصة والمدارس والتسعير.' },
}

export const LoginPage = () => {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('student')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const copy = TAB_COPY[tab]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const session = await login({ ...form, portal: tab })
      const from = location.state?.from?.pathname
      navigate(from || session.homeRoute || resolvePostLoginRoute(session.user), { replace: true })
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول')
    }
  }

  return (
    <div dir="rtl">
      <Tabs tabs={LOGIN_TABS} activeId={tab} onChange={setTab} />
      <div className="p-comfortable md:p-loose">
        <PageHeader
          variant="compact"
          title={copy.title}
          description={copy.desc}
          className="mb-loose"
        />

        <form onSubmit={handleSubmit} className="space-y-comfortable">
          {error && (
            <Alert variant="error" title="تعذّر تسجيل الدخول">
              {error}
            </Alert>
          )}
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            icon="alternate_email"
            placeholder="أدخل بريدك الإلكتروني"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            icon="lock"
            iconPosition="start"
            showPasswordToggle
            placeholder="أدخل كلمة المرور"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <p className="mt-comfortable text-center text-label-md text-on-surface-variant">
          <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-primary hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </p>

        <p className="mt-tight text-center text-label-md text-on-surface-variant">
          ليس لديك حساب؟{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
            إنشاء حساب
          </Link>
        </p>

        <div className="mt-loose flex flex-wrap justify-center gap-3 border-t border-outline-variant/50 pt-comfortable">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface-variant"
            >
              <Icon name={badge.icon} size={16} className="text-primary" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
