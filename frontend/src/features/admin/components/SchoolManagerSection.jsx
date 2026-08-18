import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Alert, Button, FormSection, Input,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { useToast } from '@/hooks/useToast'
import { DIGITS_IN_NAME_REGEX } from '@/lib/validators/common'

const emptyCreateForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
}

export const SchoolManagerSection = ({
  schoolId,
  hasManager,
  onSuccess,
}) => {
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createdCredentials, setCreatedCredentials] = useState(null)

  const assignMutation = useMutation({
    mutationFn: (data) => adminService.assignSchoolManager(schoolId, data).then(unwrap),
    onSuccess: (data, variables) => {
      toast.success('تم إنشاء حساب المدير')
      if (variables.password) {
        setCreatedCredentials({ email: variables.email, password: variables.password })
      }
      setShowForm(false)
      setCreateForm(emptyCreateForm)
      onSuccess?.(data)
    },
    onError: (err, variables) => {
      const message = getErrorMessage(err)
      if (message.includes('مدير بالفعل') && !variables.replace) {
        if (window.confirm('المدرسة لديها مدير — هل تريد استبداله؟')) {
          assignMutation.mutate({ ...variables, replace: true })
        }
        return
      }
      toast.error(err, 'فشل إنشاء حساب المدير')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    assignMutation.mutate({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim(),
      password: createForm.password,
      replace: hasManager,
    })
  }

  const resetForm = () => {
    setShowForm(false)
    setCreateForm(emptyCreateForm)
  }

  return (
    <div className="space-y-3">
      {createdCredentials && (
        <Alert
          variant="success"
          title="تم إنشاء حساب المدير"
          onDismiss={() => setCreatedCredentials(null)}
        >
          سلّم بيانات الدخول لمدير المدرسة عبر{' '}
          <span className="font-medium">بوابة المدرسة</span>:{' '}
          <span className="break-all font-mono">
            {createdCredentials.email} / {createdCredentials.password}
          </span>
        </Alert>
      )}

      {!showForm ? (
        <Button
          size="sm"
          variant={hasManager ? 'outline' : 'ultra'}
          onClick={() => setShowForm(true)}
        >
          {hasManager ? 'استبدال المدير' : 'إضافة مدير'}
        </Button>
      ) : (
        <div className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-comfortable">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-label-md font-medium text-on-surface">
              {hasManager ? 'استبدال مدير المدرسة' : 'إنشاء حساب مدير المدرسة'}
            </p>
            <Button size="sm" variant="ghost" onClick={resetForm}>
              إلغاء
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <FormSection className="grid gap-4 sm:grid-cols-2">
              <Input
                label="الاسم"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({
                  ...f,
                  name: e.target.value.replace(DIGITS_IN_NAME_REGEX, ''),
                }))}
                required
              />
              <Input
                label="البريد"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="الهاتف"
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                required
              />
              <Input
                label="كلمة المرور"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                required
                hint="8 أحرف على الأقل"
              />
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="ultra"
                  disabled={assignMutation.isPending}
                >
                  {assignMutation.isPending
                    ? 'جاري الحفظ…'
                    : hasManager
                      ? 'تأكيد الاستبدال'
                      : 'إنشاء الحساب'}
                </Button>
              </div>
            </FormSection>
          </form>
        </div>
      )}
    </div>
  )
}
