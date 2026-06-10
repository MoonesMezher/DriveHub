import { Routes, Route, Navigate } from 'react-router-dom'
import { ManagerHomePage } from './ManagerHomePage'
import { ManagerCoursesPage } from './ManagerCoursesPage'
import { ManagerEnrollmentsPage } from './ManagerEnrollmentsPage'
import { ManagerInstructorsPage } from './ManagerInstructorsPage'
import { ManagerRosterPage } from './ManagerRosterPage'

export const ManagerRoutes = () => (
  <Routes>
    <Route index element={<ManagerHomePage />} />
    <Route path="courses" element={<ManagerCoursesPage />} />
    <Route path="enrollments" element={<ManagerEnrollmentsPage />} />
    <Route path="instructors" element={<ManagerInstructorsPage />} />
    <Route path="roster" element={<ManagerRosterPage />} />
    <Route path="*" element={<Navigate to="" replace />} />
  </Routes>
)
