import { Routes, Route, Navigate } from 'react-router-dom'
import { ManagerHomePage } from './ManagerHomePage'
import { ManagerCoursesPage } from './ManagerCoursesPage'
import { ManagerEnrollmentsPage } from './ManagerEnrollmentsPage'
import { ManagerInstructorsPage } from './ManagerInstructorsPage'
import { ManagerRosterPage } from './ManagerRosterPage'
import { ManagerQuestionBanksPage } from './ManagerQuestionBanksPage'
import { ManagerContentPage } from './ManagerContentPage'
import { ManagerContentEditsPage } from './ManagerContentEditsPage'
import { ManagerSchedulePage } from './ManagerSchedulePage'

export const ManagerRoutes = () => (
  <Routes>
    <Route index element={<ManagerHomePage />} />
    <Route path="courses" element={<ManagerCoursesPage />} />
    <Route path="schedule" element={<ManagerSchedulePage />} />
    <Route path="enrollments" element={<ManagerEnrollmentsPage />} />
    <Route path="instructors" element={<ManagerInstructorsPage />} />
    <Route path="question-banks" element={<ManagerQuestionBanksPage />} />
    <Route path="content" element={<ManagerContentPage />} />
    <Route path="content-edits" element={<ManagerContentEditsPage />} />
    <Route path="roster" element={<ManagerRosterPage />} />
    <Route path="*" element={<Navigate to="" replace />} />
  </Routes>
)
