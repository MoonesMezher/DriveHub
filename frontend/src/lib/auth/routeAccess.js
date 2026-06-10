import { ROLES } from '@/lib/constants/roles'
import { ROUTES } from '@/lib/constants/routes'
import { PERMISSIONS as P } from './permissions'

/** مسارات البوابات الرئيسية لكل دور */
export const ROLE_HOME_ROUTES = {
  [ROLES.REGISTERED]: ROUTES.DASHBOARD,
  [ROLES.STUDENT]: ROUTES.STUDENT,
  [ROLES.COACH]: ROUTES.COACH,
  [ROLES.MANAGER]: ROUTES.MANAGER,
  [ROLES.ADMIN]: ROUTES.ADMIN,
  [ROLES.TRAFFIC]: ROUTES.TRAFFIC,
}

/**
 * قواعد الوصول للمسارات — roles و/أو permissions
 */
export const ROUTE_ACCESS = {
  [ROUTES.LOGIN]: { guestOnly: true },
  [ROUTES.REGISTER]: { guestOnly: true },
  [ROUTES.DASHBOARD]: {
    roles: [ROLES.REGISTERED, ROLES.STUDENT, ROLES.COACH, ROLES.MANAGER, ROLES.ADMIN, ROLES.TRAFFIC],
  },
  [ROUTES.PROFILE]: { permissions: [P.MANAGE_PROFILE] },
  [ROUTES.ENROLL]: { permissions: [P.SUBMIT_ENROLLMENT] },
  [ROUTES.STUDENT]: { roles: [ROLES.STUDENT], permissions: [P.ACCESS_STUDENT_PORTAL] },
  [ROUTES.COACH]: { roles: [ROLES.COACH], permissions: [P.ACCESS_COACH_PORTAL] },
  [ROUTES.MANAGER]: { roles: [ROLES.MANAGER], permissions: [P.ACCESS_MANAGER_PORTAL] },
  [ROUTES.ADMIN]: { roles: [ROLES.ADMIN], permissions: [P.ACCESS_ADMIN_PORTAL] },
  [ROUTES.TRAFFIC]: { roles: [ROLES.TRAFFIC], permissions: [P.ACCESS_TRAFFIC_PORTAL] },
  [ROUTES.SAMPLE]: {
    anyPermission: [P.VIEW_SAMPLE_PARTIAL, P.VIEW_SAMPLE_FULL],
    public: true,
  },
}

export const getHomeRouteForRole = (role) => ROLE_HOME_ROUTES[role] || ROUTES.DASHBOARD

export const matchRouteAccess = (pathname) => {
  const base = `/${pathname.split('/').filter(Boolean)[0] || ''}`
  const key = base === '/' ? ROUTES.HOME : base
  return ROUTE_ACCESS[key] || null
}
