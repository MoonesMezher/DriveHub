import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Input, Tabs } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'
import { resolvePostLoginRoute } from '@/lib/auth/authUtils'

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
    <>
      <Tabs tabs={LOGIN_TABS} activeId={tab} onChange={setTab} />
      <div className="p-comfortable md:p-loose">
        <div className="mb-loose">
          <h2 className="text-headline-sm text-on-surface">{copy.title}</h2>
          <p className="text-body-md text-on-surface-variant">{copy.desc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-comfortable">
          {error && (
            <p className="rounded-lg bg-error-container px-3 py-2 text-label-sm text-on-error-container">
              {error}
            </p>
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
          ليس لديك حساب؟{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
            إنشاء حساب
          </Link>
        </p>
      </div>
    </>
  )
}
