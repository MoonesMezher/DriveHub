import { Routes, Route } from 'react-router-dom'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { ProtectedRoute } from '@/app/guards/ProtectedRoute'
import { GuestRoute } from '@/app/guards/GuestRoute'
import { ROLES } from '@/lib/constants/roles'
import { PERMISSIONS } from '@/lib/auth/permissions'

import { HomePage } from '@/features/home/pages/HomePage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { UnauthorizedPage } from '@/features/auth/pages/UnauthorizedPage'
import { LicensesPage } from '@/features/licenses/pages/LicensesPage'
import { LicenseDetailPage } from '@/features/licenses/pages/LicenseDetailPage'
import { SchoolsNearbyPage } from '@/features/schools/pages/SchoolsNearbyPage'
import { SchoolDetailPage } from '@/features/schools/pages/SchoolDetailPage'
import { DashboardPage } from '@/features/shared/pages/DashboardPage'
import { NotFoundPage } from '@/features/shared/pages/NotFoundPage'
import { StudentRoutes } from '@/features/student/pages/StudentRoutes'
import { CoachRoutes } from '@/features/coach/pages/CoachRoutes'
import { ManagerRoutes } from '@/features/manager/pages/ManagerRoutes'
import { AdminRoutes } from '@/features/admin/pages/AdminRoutes'
import { TrafficRoutes } from '@/features/traffic/pages/TrafficRoutes'
import { EnrollPage } from '@/features/enrollment/pages/EnrollPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { RequirementsPage } from '@/features/shared/pages/RequirementsPage'
import { SamplePage } from '@/features/shared/pages/SamplePage'
import { FaqPage } from '@/features/shared/pages/FaqPage'
import { PrivacyPage } from '@/features/shared/pages/PrivacyPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { AddSchoolPage } from '@/features/shared/pages/AddSchoolPage'

export const AppRouter = () => (
  <Routes>
    {/* عام — متاح للجميع */}
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="licenses" element={<LicensesPage />} />
      <Route path="licenses/:code" element={<LicenseDetailPage />} />
      <Route path="schools/nearby" element={<SchoolsNearbyPage />} />
      <Route path="schools/:id" element={<SchoolDetailPage />} />
      <Route path="requirements" element={<RequirementsPage />} />
      <Route path="sample" element={<SamplePage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="add-school" element={<AddSchoolPage />} />
      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>

    {/* ضيف فقط — يُعاد توجيه المسجّلين */}
    <Route element={<GuestRoute />}>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Route>

    {/* مسجّل — لوحة عامة + ملف + اشتراك */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[ROLES.REGISTERED, ROLES.STUDENT, ROLES.COACH, ROLES.MANAGER, ROLES.ADMIN, ROLES.TRAFFIC]}
        />
      }
    >
      <Route element={<DashboardLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="enroll" element={<EnrollPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Route>

    {/* بوابة الطالب */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[ROLES.STUDENT]}
          requiredPermissions={[PERMISSIONS.ACCESS_STUDENT_PORTAL]}
        />
      }
    >
      <Route element={<DashboardLayout />}>
        <Route path="student/*" element={<StudentRoutes />} />
      </Route>
    </Route>

    {/* بوابة المدرب */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[ROLES.COACH]}
          requiredPermissions={[PERMISSIONS.ACCESS_COACH_PORTAL]}
        />
      }
    >
      <Route element={<DashboardLayout />}>
        <Route path="coach/*" element={<CoachRoutes />} />
      </Route>
    </Route>

    {/* بوابة مدير المدرسة */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[ROLES.MANAGER]}
          requiredPermissions={[PERMISSIONS.ACCESS_MANAGER_PORTAL]}
        />
      }
    >
      <Route element={<DashboardLayout />}>
        <Route path="manager/*" element={<ManagerRoutes />} />
      </Route>
    </Route>

    {/* بوابة Admin */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[ROLES.ADMIN]}
          requiredPermissions={[PERMISSIONS.ACCESS_ADMIN_PORTAL]}
        />
      }
    >
      <Route element={<DashboardLayout />}>
        <Route path="admin/*" element={<AdminRoutes />} />
      </Route>
    </Route>

    {/* بوابة المرور */}
    <Route
      element={
        <ProtectedRoute
          allowedRoles={[ROLES.TRAFFIC]}
          requiredPermissions={[PERMISSIONS.ACCESS_TRAFFIC_PORTAL]}
        />
      }
    >
      <Route element={<DashboardLayout />}>
        <Route path="traffic/*" element={<TrafficRoutes />} />
      </Route>
    </Route>
  </Routes>
)
