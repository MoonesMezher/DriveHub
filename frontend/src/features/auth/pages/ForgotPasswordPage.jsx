import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Input, PageHeader } from '@/components/ui'
import { authService } from '@/lib/services/authService'
import { ROUTES } from '@/lib/constants/routes'

const RESEND_SECONDS = 60

export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [form, setForm] = useState({
    email: '',
    code: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const canResend = now >= resendAt
  const countdown = useMemo(() => Math.max(0, Math.ceil((resendAt - now) / 1000)), [resendAt, now])

  const requestCode = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await authService.forgotPassword({ email: form.email })
      setSuccess(res.message || 'إذا كان البريد مسجلاً سيتم إرسال رمز التحقق')
      setResendAt(Date.now() + RESEND_SECONDS * 1000)
      setStep(2)
    } catch (err) {
      setError(err.message || 'تعذر إرسال الرمز')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await authService.verifyResetCode({ email: form.email, code: form.code })
      setForm((prev) => ({ ...prev, resetToken: res.data.resetToken }))
      setSuccess('تم التحقق من الرمز بنجاح')
      setStep(3)
    } catch (err) {
      setError(err.message || 'رمز التحقق غير صحيح')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await authService.resetPassword({
        email: form.email,
        resetToken: form.resetToken,
        newPassword: form.newPassword,
      })
      setSuccess('تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن')
      setTimeout(() => navigate(ROUTES.LOGIN), 1200)
    } catch (err) {
      setError(err.message || 'تعذر تغيير كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="p-comfortable md:p-loose">
      <PageHeader
        variant="compact"
        title="نسيت كلمة المرور"
        description="أدخل بريدك الإلكتروني، تحقق من الرمز، ثم اختر كلمة مرور جديدة."
        className="mb-loose"
      />

      {error && (
        <Alert variant="error" title="خطأ">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" title="تم">
          {success}
        </Alert>
      )}

      <div className="mt-comfortable space-y-comfortable">
        <Input
          label="البريد الإلكتروني"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          disabled={step > 1}
          required
        />

        {step >= 2 && (
          <Input
            label="رمز التحقق (6 أرقام)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            maxLength={6}
            required
          />
        )}

        {step >= 3 && (
          <>
            <Input
              label="كلمة المرور الجديدة"
              type="password"
              showPasswordToggle
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
            />
            <Input
              label="تأكيد كلمة المرور الجديدة"
              type="password"
              showPasswordToggle
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
          </>
        )}

        {step === 1 && (
          <Button className="w-full" disabled={loading || !form.email} onClick={requestCode}>
            {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
          </Button>
        )}
        {step === 2 && (
          <div className="space-y-2">
            <Button className="w-full" disabled={loading || form.code.length !== 6} onClick={verifyCode}>
              {loading ? 'جاري التحقق...' : 'تحقق من الرمز'}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={loading || !canResend}
              onClick={requestCode}
            >
              {canResend ? 'إعادة إرسال الرمز' : `إعادة الإرسال بعد ${countdown} ثانية`}
            </Button>
          </div>
        )}
        {step === 3 && (
          <Button className="w-full" disabled={loading || !form.newPassword || !form.confirmPassword} onClick={resetPassword}>
            {loading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </Button>
        )}
      </div>

      <p className="mt-comfortable text-center text-label-md text-on-surface-variant">
        تذكرت كلمة المرور؟{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
