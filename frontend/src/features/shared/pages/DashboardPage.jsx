import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, StatCard, Button, Icon, AsyncContent, StatusBadge, Alert } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS, ROLES } from '@/lib/constants/roles'
import { ROUTES } from '@/lib/constants/routes'
import { enrollmentService, notificationService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'

const roleLinks = {
  [ROLES.STUDENT]: { to: ROUTES.STUDENT, label: 'لوحة الطالب', icon: 'school' },
  [ROLES.COACH]: { to: ROUTES.COACH, label: 'لوحة المدرب', icon: 'sports_motorsports' },
  [ROLES.MANAGER]: { to: ROUTES.MANAGER, label: 'لوحة المدير', icon: 'domain' },
  [ROLES.ADMIN]: { to: ROUTES.ADMIN, label: 'لوحة Admin', icon: 'admin_panel_settings' },
  [ROLES.TRAFFIC]: { to: ROUTES.TRAFFIC, label: 'بوابة المرور', icon: 'traffic' },
}

const quickLinks = [
  { to: ROUTES.PROFILE, label: 'الملف الشخصي', desc: 'عرض وتعديل بياناتك', icon: 'person' },
  { to: ROUTES.ENROLL, label: 'طلب اشتراك', desc: 'التقديم لمدرسة قريبة', icon: 'how_to_reg' },
  { to: ROUTES.NOTIFICATIONS, label: 'الإشعارات', desc: 'تنبيهاتك وتحديثاتك', icon: 'notifications' },
  { to: ROUTES.SCHOOLS_NEARBY, label: 'أقرب المدارس', desc: 'ابحث جغرافياً', icon: 'location_on' },
]

const registeredNextSteps = [
  { to: ROUTES.PROFILE, label: 'أكمل الملف الشخصي', desc: 'حدّث بياناتك وارفع صورتك الشخصية', icon: 'person' },
  { to: ROUTES.REQUIREMENTS, label: 'ارفع الهوية والتوثيق الطبي', desc: 'تعرّف على المستندات المطلوبة ثم ارفعها من الملف الشخصي', icon: 'badge' },
  { to: ROUTES.ENROLL, label: 'اختر رخصة ومدرسة وقدّم طلب اشتراك', desc: 'اختر فئة الرخصة والمدرسة المناسبة لك', icon: 'how_to_reg' },
  { to: ROUTES.HELP, label: 'مركز المساعدة', desc: 'إرشادات وأسئلة شائعة حول الخطوات التالية', icon: 'help' },
]

export const DashboardPage = () => {
  const { user, activeRole } = useAuth()
  const portalLink = roleLinks[activeRole]

  const { data: enrollments, isLoading: enrollLoading } = useQuery({
    queryKey: ['enrollments', 'mine'],
    queryFn: async () => unwrap(await enrollmentService.list()),
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => unwrap(await notificationService.list({ limit: 20, unreadOnly: 'true' })),
  })

  const items = enrollments?.enrollments ?? enrollments?.items ?? []
  const activeEnrollment = items.find?.(
    (e) => !['rejected', 'cancelled', 'expired'].includes(e.status),
  ) ?? null
  const unread = notifications?.items?.length ?? 0

  return (
    <div dir="rtl" className="space-y-loose">
      <PageHeader
        title={`مرحباً، ${user?.name || 'مستخدم'}`}
        description={`السياق النشط: ${ROLE_LABELS[activeRole] || activeRole}`}
        actions={
          portalLink && (
            <Link to={portalLink.to}>
              <Button leftIcon={<Icon name={portalLink.icon} size={20} />}>
                {portalLink.label}
              </Button>
            </Link>
          )
        }
      />

      {activeRole === ROLES.REGISTERED && (
        <Alert variant="info" title="الخطوات التالية للاشتراك في دورة">
          <p className="mb-comfortable text-on-surface-variant">
            بعد إنشاء حسابك، أكمل هذه الخطوات للتقديم على مدرسة القيادة:
          </p>
          <ol className="grid gap-3 sm:grid-cols-2">
            {registeredNextSteps.map((step, index) => (
              <li key={step.to}>
                <Link
                  to={step.to}
                  className="flex gap-3 rounded-xl border border-outline-variant bg-surface p-comfortable transition-colors hover:border-primary/40 hover:bg-primary-container/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-label-md font-semibold text-on-primary-container">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-label-md font-semibold text-primary">
                      <Icon name={step.icon} size={18} />
                      {step.label}
                    </span>
                    <span className="mt-0.5 block text-body-md text-on-surface-variant">{step.desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Alert>
      )}

      <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="الدور الحالي" value={ROLE_LABELS[activeRole] || '—'} icon="badge" />
        <StatCard label="إشعارات جديدة" value={unread} icon="notifications" />
        <StatCard
          label="حالة الاشتراك"
          value={activeEnrollment ? 'متابَع' : 'لا يوجد'}
          icon="school"
        />
        <StatCard label="حالة الحساب" value="نشط" icon="verified_user" trend="up" trendLabel="جاهز" />
      </div>

      <AsyncContent isLoading={enrollLoading}>
        {() =>
          activeEnrollment ? (
            <Card title="آخر اشتراك">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={activeEnrollment.status} />
                <span className="text-body-md text-on-surface-variant">
                  فئة {activeEnrollment.categoryCode}
                </span>
                <Link to={ROUTES.ENROLL}>
                  <Button variant="outline" size="sm">إدارة الاشتراك</Button>
                </Link>
              </div>
            </Card>
          ) : null
        }
      </AsyncContent>

      <div>
        <PageHeader
          variant="compact"
          title="اختصارات سريعة"
          description="انتقل مباشرة إلى أهم الصفحات"
          className="mb-comfortable"
        />
        <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Card hoverable className="h-full">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
                  <Icon name={link.icon} size={28} />
                </div>
                <h3 className="text-headline-sm text-primary">{link.label}</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">{link.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-label-md text-primary">
                  فتح
                  <Icon name="arrow_back" size={16} />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
