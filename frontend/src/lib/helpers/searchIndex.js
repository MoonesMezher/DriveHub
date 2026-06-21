import { SIDEBAR_BY_ROLE } from '@/lib/design/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { ROLES } from '@/lib/constants/roles'

const SHARED_PAGES = [
  { to: ROUTES.PROFILE, label: 'الملف الشخصي', icon: 'person' },
  { to: ROUTES.NOTIFICATIONS, label: 'الإشعارات', icon: 'notifications' },
  { to: ROUTES.DASHBOARD, label: 'لوحة التحكم', icon: 'dashboard' },
]

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export const buildLocalSearchIndex = (activeRole) => {
  const roleConfig = SIDEBAR_BY_ROLE[activeRole]
  const pages = [...SHARED_PAGES]

  if (activeRole !== ROLES.TRAFFIC && activeRole !== ROLES.MANAGER) {
    pages.push({ to: ROUTES.ENROLL, label: 'اشتراكي', icon: 'school' })
  }

  if (roleConfig?.items) {
    pages.push(...roleConfig.items.map((item) => ({ ...item, subtitle: roleConfig.subtitle })))
  }

  if (roleConfig?.cta?.to) {
    pages.push({
      to: roleConfig.cta.to,
      label: roleConfig.cta.label,
      icon: roleConfig.cta.icon || 'add_circle',
      subtitle: roleConfig.subtitle,
    })
  }

  return pages
}

export const searchLocalPages = (activeRole, query) => {
  const q = normalize(query)
  if (q.length < 2) return []

  return buildLocalSearchIndex(activeRole)
    .filter((page) => normalize(page.label).includes(q) || normalize(page.subtitle).includes(q))
    .map((page, index) => ({
      id: `nav-${page.to}-${index}`,
      type: 'page',
      title: page.label,
      subtitle: page.subtitle || 'صفحة',
      href: page.to,
      icon: page.icon || 'link',
    }))
}
