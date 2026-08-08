import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  PageHeader, Card, Button, Input, SettingsTabs, AsyncContent, StatCard,
  FormSection, Textarea, Switch,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/helpers/format'
import { ROUTES } from '@/lib/constants/routes'

const TABS = [
  { id: 'general', label: 'عام', icon: 'tune' },
  { id: 'financial', label: 'مالي', icon: 'payments' },
  { id: 'operations', label: 'تشغيل', icon: 'settings_suggest' },
  { id: 'legal', label: 'قانوني', icon: 'gavel' },
]

const ADMIN_ROLES = [
  {
    title: 'صاحب المنصة (Admin)',
    items: [
      'قبول طلبات انضمام المدارس أو إضافة مدرسة مباشرة',
      'إنشاء حسابات إدارة المرور / وزارة النقل وتسليم بيانات الدخول',
      'إدارة التسعير، المستخدمين، والتقارير',
    ],
  },
  {
    title: 'إدارة المرور (Traffic)',
    items: [
      'مراقبة سير عمل المنصة وقوائم الطلاب',
      'نشر أسماء الناجحين ونتائج الامتحانات',
      'الوصول لبيانات الطلاب المرسلة من المدارس',
    ],
  },
  {
    title: 'مدير المدرسة (Manager)',
    items: [
      'إضافة المدربين وتعيينهم للمدرسة',
      'إدارة الدورات والاشتراكات وقوائم الامتحان',
    ],
  },
]

export const AdminSettingsPage = () => {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('general')
  const [commission, setCommission] = useState('0.02')
  const [privacyContent, setPrivacyContent] = useState('')
  const [registrationPaused, setRegistrationPaused] = useState(false)

  const { data: reportsPayload, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'settings'],
    queryFn: async () => unwrap(await adminService.reports()),
  })

  const reports = reportsPayload?.reports ?? reportsPayload ?? {}

  useEffect(() => {
    if (reports.commissionRate != null) {
      setCommission(String(reports.commissionRate))
    }
  }, [reports.commissionRate])

  const privacyQuery = useQuery({
    queryKey: ['admin', 'privacy'],
    queryFn: async () => unwrap(await adminService.getPrivacy()),
    enabled: tab === 'legal',
  })

  const registrationQuery = useQuery({
    queryKey: ['admin', 'registration'],
    queryFn: async () => unwrap(await adminService.getRegistrationSettings()),
  })

  useEffect(() => {
    if (typeof registrationQuery.data?.registrationPaused === 'boolean') {
      setRegistrationPaused(registrationQuery.data.registrationPaused)
    }
  }, [registrationQuery.data?.registrationPaused])

  const saveCommission = useMutation({
    mutationFn: async (value) => unwrap(await adminService.updateCommission(Number(value))),
    onSuccess: (data) => {
      if (data?.commission != null) setCommission(String(data.commission))
      toast.success('تم تحديث نسبة العمولة')
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const distribute = useMutation({
    mutationFn: async () => unwrap(await adminService.distributeRosters({})),
    onSuccess: (res) => {
      const count = res?.distributed ?? res?.data?.distributed ?? 0
      toast.success(`تم توزيع ${count} قائمة`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const savePrivacy = useMutation({
    mutationFn: async (content) => unwrap(await adminService.updatePrivacy(content)),
    onSuccess: (data) => {
      if (data?.content != null) setPrivacyContent(data.content)
      toast.success('تم حفظ سياسة الخصوصية')
      queryClient.invalidateQueries({ queryKey: ['admin', 'privacy'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'privacy'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const saveRegistration = useMutation({
    mutationFn: async (paused) =>
      unwrap(await adminService.updateRegistrationSettings({ registrationPaused: paused })),
    onSuccess: (data) => {
      if (typeof data?.registrationPaused === 'boolean') {
        setRegistrationPaused(data.registrationPaused)
      }
      toast.success('تم تحديث إعدادات التسجيل')
      queryClient.invalidateQueries({ queryKey: ['admin', 'registration'] })
    },
    onError: (err, paused) => {
      setRegistrationPaused(!paused)
      toast.error(getErrorMessage(err))
    },
  })

  useEffect(() => {
    if (privacyQuery.data?.content && tab === 'legal') {
      setPrivacyContent(privacyQuery.data.content)
    }
  }, [privacyQuery.data?.content, tab])

  return (
    <div dir="rtl">
      <PageHeader
        variant="compact"
        title="إعدادات النظام"
        description="إدارة إعدادات المنصة — الأدوار، العمليات، والمحتوى القانوني"
      />

      <div className="grid gap-loose lg:grid-cols-4">
        <SettingsTabs tabs={TABS} active={tab} onChange={setTab} variant="ultra" />

        <div className="lg:col-span-3">
          <AsyncContent isLoading={isLoading && tab !== 'legal' && tab !== 'operations'}>
            {() => (
            <>
            {tab === 'general' && (
              <div className="space-y-loose">
                <Card title="معلومات المنصة" padding="lg">
                  <FormSection>
                    <div className="grid gap-comfortable sm:grid-cols-2">
                      <StatCard label="المدارس النشطة" value={formatNumber(reports?.schools?.active ?? 0)} icon="domain" />
                      <StatCard label="المستخدمون" value={formatNumber(reports?.users?.active ?? 0)} icon="group" />
                    </div>
                    <Input label="اسم المنصة" value="DriveHub" readOnly disabled />
                    <Input label="البيئة" value={import.meta.env.MODE} readOnly disabled />
                    <p className="text-body-md text-on-surface-variant">
                      لإدارة الرخص والتسعير التفصيلي، انتقل إلى{' '}
                      <Link to={`${ROUTES.ADMIN}/pricing`} className="text-primary underline">
                        صفحة التسعير
                      </Link>
                      .
                    </p>
                  </FormSection>
                </Card>

                <Card title="أدوار المنصة ومسؤولياتها" padding="lg">
                  <p className="mb-comfortable text-body-md text-on-surface-variant">
                    توضيح لصلاحيات كل دور في نظام DriveHub
                  </p>
                  <div className="space-y-comfortable">
                    {ADMIN_ROLES.map((role) => (
                      <div key={role.title} className="rounded-lg bg-surface-container p-comfortable">
                        <h4 className="text-label-md font-semibold text-primary">{role.title}</h4>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-body-md text-on-surface-variant">
                          {role.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {tab === 'financial' && (
              <Card title="العمولة والإيرادات" padding="lg">
                <FormSection
                  description={`العمولة الحالية: ${formatPercent(reports?.commissionRate ?? 0.02)}`}
                >
                  <Input
                    label="نسبة العمولة (0–1)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    hint="مثال: 0.02 = 2%"
                  />
                  <div className="grid gap-comfortable sm:grid-cols-2">
                    <StatCard
                      label="إجمالي المدفوعات"
                      value={formatCurrency(reports?.payments?.totalAmount)}
                      icon="account_balance"
                    />
                    <StatCard
                      label="حصة المنصة"
                      value={formatCurrency(reports?.payments?.platformShare)}
                      icon="savings"
                    />
                  </div>
                  <Button
                    variant="ultra"
                    onClick={() => saveCommission.mutate(commission)}
                    disabled={saveCommission.isPending}
                  >
                    حفظ العمولة
                  </Button>
                </FormSection>
              </Card>
            )}

            {tab === 'operations' && (
              <Card title="عمليات المنصة" padding="lg">
                <FormSection description="إعدادات التشغيل اليومية وتوزيع القوائم">
                  <AsyncContent isLoading={registrationQuery.isLoading} error={registrationQuery.error}>
                    {() => (
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant p-comfortable">
                        <div>
                          <p className="text-headline-sm text-on-surface">إيقاف التسجيل على مستوى المنصة</p>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            يمنع تقديم طلبات اشتراك جديدة وطلبات انضمام المدارس مؤقتاً
                          </p>
                        </div>
                        <Switch
                          checked={registrationPaused}
                          onChange={(checked) => {
                            setRegistrationPaused(checked)
                            saveRegistration.mutate(checked)
                          }}
                          disabled={saveRegistration.isPending}
                        />
                      </div>
                    )}
                  </AsyncContent>
                  <p className="text-body-md text-on-surface-variant">
                    توزيع قوائم الطلاب المرسلة من المدارس إلى إدارة المرور.
                  </p>
                  <Button
                    variant="ultra"
                    onClick={() => distribute.mutate()}
                    disabled={distribute.isPending}
                  >
                    توزيع القوائم المعلّقة
                  </Button>
                  <div className="flex flex-wrap gap-3">
                    <Link to={`${ROUTES.ADMIN}/compliance`}>
                      <Button variant="outline">التحقق وطلبات المدارس</Button>
                    </Link>
                    <Link to={`${ROUTES.ADMIN}/schools`}>
                      <Button variant="outline">إدارة المدارس</Button>
                    </Link>
                    <Link to={`${ROUTES.ADMIN}/users`}>
                      <Button variant="outline">حسابات المرور</Button>
                    </Link>
                  </div>
                </FormSection>
              </Card>
            )}

            {tab === 'legal' && (
              <Card title="سياسة الخصوصية" padding="lg">
                <FormSection
                  description={
                    <>
                      يُعرض هذا المحتوى في{' '}
                      <Link to={ROUTES.PRIVACY} className="text-primary underline" target="_blank">
                        صفحة سياسة الخصوصية العامة
                      </Link>
                      . يدعم Markdown بسيط (**نص عريض**، ## عنوان).
                    </>
                  }
                >
                  <AsyncContent isLoading={privacyQuery.isLoading} error={privacyQuery.error}>
                    {() => (
                      <>
                        <Textarea
                          id="privacy-content"
                          label="محتوى سياسة الخصوصية"
                          rows={18}
                          value={privacyContent || privacyQuery.data?.content || ''}
                          onChange={(e) => setPrivacyContent(e.target.value)}
                        />
                        <Button
                          variant="ultra"
                          onClick={() => savePrivacy.mutate(privacyContent || privacyQuery.data?.content)}
                          disabled={savePrivacy.isPending}
                        >
                          حفظ سياسة الخصوصية
                        </Button>
                      </>
                    )}
                  </AsyncContent>
                </FormSection>
              </Card>
            )}
            </>
            )}
          </AsyncContent>
        </div>
      </div>
    </div>
  )
}
