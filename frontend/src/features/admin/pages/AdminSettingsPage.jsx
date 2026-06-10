import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  PageHeader, Card, Button, Input, SettingsTabs, AsyncContent, StatCard,
} from '@/components/ui'
import { adminService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { formatCurrency } from '@/lib/helpers/format'
import { ROUTES } from '@/lib/constants/routes'

const TABS = [
  { id: 'general', label: 'عام', icon: 'tune' },
  { id: 'financial', label: 'مالي', icon: 'payments' },
  { id: 'operations', label: 'تشغيل', icon: 'settings_suggest' },
]

export const AdminSettingsPage = () => {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('general')
  const [commission, setCommission] = useState('0.02')

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'settings'],
    queryFn: async () => unwrap(await adminService.reports()),
  })

  const saveCommission = useMutation({
    mutationFn: (value) => adminService.updateCommission(Number(value)),
    onSuccess: () => {
      toast.success('تم تحديث نسبة العمولة')
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const distribute = useMutation({
    mutationFn: () => adminService.distributeRosters({}),
    onSuccess: (res) => {
      const count = res?.data?.distributed ?? res?.distributed ?? 0
      toast.success(`تم توزيع ${count} قائمة`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div dir="rtl">
      <PageHeader
        title="إعدادات النظام"
        description="إدارة إعدادات المنصة العامة — شاشة 23 من مركز التصميم"
      />

      <div className="grid gap-loose lg:grid-cols-4">
        <SettingsTabs tabs={TABS} active={tab} onChange={setTab} variant="ultra" />

        <div className="lg:col-span-3">
          <AsyncContent isLoading={isLoading}>
            {() => (
            <>
            {tab === 'general' && (
              <Card title="معلومات المنصة" padding="lg">
                <div className="grid gap-comfortable sm:grid-cols-2">
                  <StatCard label="المدارس النشطة" value={reports?.schools?.active ?? '—'} icon="domain" />
                  <StatCard label="المستخدمون" value={reports?.users?.active ?? '—'} icon="group" />
                </div>
                <div className="mt-loose space-y-comfortable">
                  <Input label="اسم المنصة" value="DriveHub" readOnly disabled />
                  <Input label="البيئة" value={import.meta.env.MODE} readOnly disabled />
                  <p className="text-body-md text-on-surface-variant">
                    لإدارة الرخص والتسعير التفصيلي، انتقل إلى{' '}
                    <Link to={`${ROUTES.ADMIN}/pricing`} className="text-primary underline">
                      صفحة التسعير
                    </Link>
                    .
                  </p>
                </div>
              </Card>
            )}

            {tab === 'financial' && (
              <Card title="العمولة والإيرادات" padding="lg">
                <p className="mb-comfortable text-body-md text-on-surface-variant">
                  العمولة الحالية: {(reports?.commissionRate ?? 0.02) * 100}%
                </p>
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
                <div className="mt-comfortable grid gap-comfortable sm:grid-cols-2">
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
                  className="mt-loose"
                  variant="ultra"
                  onClick={() => saveCommission.mutate(commission)}
                  disabled={saveCommission.isPending}
                >
                  حفظ العمولة
                </Button>
              </Card>
            )}

            {tab === 'operations' && (
              <Card title="عمليات المنصة" padding="lg">
                <p className="text-body-md text-on-surface-variant">
                  توزيع قوائم الطلاب المرسلة من المدارس إلى إدارة المرور.
                </p>
                <Button
                  className="mt-comfortable"
                  variant="ultra"
                  onClick={() => distribute.mutate()}
                  disabled={distribute.isPending}
                >
                  توزيع القوائم المعلّقة
                </Button>
                <div className="mt-loose">
                  <Link to={`${ROUTES.ADMIN}/compliance`}>
                    <Button variant="outline">التحقق والامتثال</Button>
                  </Link>
                </div>
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
