import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, StatCard, Button, Icon, AsyncContent, StatusBadge } from '@/components/ui'
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
    <div dir="rtl">
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

      <div className="mb-loose grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
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
            <Card className="mb-loose" title="آخر اشتراك">
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

      <h2 className="mb-comfortable text-headline-sm text-primary">اختصارات سريعة</h2>
      <div className="bento-grid">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Card hoverable className="h-full">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
                <Icon name={link.icon} size={22} />
              </div>
              <h3 className="text-headline-sm text-primary">{link.label}</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">{link.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-label-md text-primary">
                فتح
                <Icon name="arrow_back" size={16} />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
