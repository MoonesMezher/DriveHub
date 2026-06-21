import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminHomePage } from './AdminHomePage'
import { AdminSchoolsPage } from './AdminSchoolsPage'
import { AdminPricingPage } from './AdminPricingPage'
import { AdminCompliancePage } from './AdminCompliancePage'
import { AdminUsersPage } from './AdminUsersPage'
import { AdminReportsPage } from './AdminReportsPage'
import { AdminAuditPage } from './AdminAuditPage'
import { AdminSettingsPage } from './AdminSettingsPage'
import { AdminAdsPage } from './AdminAdsPage'

export const AdminRoutes = () => (
  <Routes>
    <Route index element={<AdminHomePage />} />
    <Route path="schools" element={<AdminSchoolsPage />} />
    <Route path="pricing" element={<AdminPricingPage />} />
    <Route path="compliance" element={<AdminCompliancePage />} />
    <Route path="users" element={<AdminUsersPage />} />
    <Route path="reports" element={<AdminReportsPage />} />
    <Route path="ads" element={<AdminAdsPage />} />
    <Route path="settings" element={<AdminSettingsPage />} />
    <Route path="audit" element={<AdminAuditPage />} />
    <Route path="*" element={<Navigate to="" replace />} />
  </Routes>
)
