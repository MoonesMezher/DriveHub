import { Navigate, Route, Routes } from 'react-router-dom'
import { CoachHomePage } from './CoachHomePage'
import { CoachSchedulePage } from './CoachSchedulePage'
import { CoachStudentsPage } from './CoachStudentsPage'
import { CoachNotesPage } from './CoachNotesPage'
import { CoachLessonsPage } from './CoachLessonsPage'

export const CoachRoutes = () => (
  <Routes>
    <Route index element={<CoachHomePage />} />
    <Route path="schedule" element={<CoachSchedulePage />} />
    <Route path="lessons" element={<CoachLessonsPage />} />
    <Route path="students" element={<CoachStudentsPage />} />
    <Route path="notes" element={<CoachNotesPage />} />
    <Route path="*" element={<Navigate to="." replace />} />
  </Routes>
)
