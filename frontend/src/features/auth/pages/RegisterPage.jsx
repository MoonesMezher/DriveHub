import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { resolvePostLoginRoute } from '@/lib/auth/authUtils'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'

export const RegisterPage = () => {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')

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
    <div className="p-comfortable md:p-loose">
      <div className="mb-loose">
        <h2 className="text-headline-sm text-on-surface">إنشاء حساب طالب</h2>
        <p className="text-body-md text-on-surface-variant">
          سجّل للوصول للعينة الكاملة والتقديم على المدارس.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-comfortable">
        {error && (
          <p className="rounded-lg bg-error-container px-3 py-2 text-label-sm text-on-error-container">
            {error}
          </p>
        )}
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
        <Input
          label="كلمة المرور"
          name="password"
          type="password"
          icon="lock"
          iconPosition="start"
          showPasswordToggle
          hint="8 أحرف على الأقل، حروف كبيرة وصغيرة، رقم، رمز خاص"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
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
