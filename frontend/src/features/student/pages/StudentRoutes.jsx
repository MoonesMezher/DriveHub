import { Navigate, Route, Routes } from 'react-router-dom'
import { StudentHomePage } from './StudentHomePage'
import { StudentTheoryPage } from './StudentTheoryPage'
import { StudentVideosPage } from './StudentVideosPage'
import { StudentPracticePage } from './StudentPracticePage'
import { StudentLessonsPage } from './StudentLessonsPage'
import { StudentExamPage } from './StudentExamPage'
import { StudentArchivePage } from './StudentArchivePage'
import { StudentStatisticsPage } from './StudentStatisticsPage'
import { StudentCertificatesPage } from './StudentCertificatesPage'

export const StudentRoutes = () => (
  <Routes>
    <Route index element={<StudentHomePage />} />
    <Route path="theory" element={<StudentTheoryPage />} />
    <Route path="videos" element={<StudentVideosPage />} />
    <Route path="practice" element={<StudentPracticePage />} />
    <Route path="lessons" element={<StudentLessonsPage />} />
    <Route path="statistics" element={<StudentStatisticsPage />} />
    <Route path="exam" element={<StudentExamPage />} />
    <Route path="certificates" element={<StudentCertificatesPage />} />
    <Route path="archive" element={<StudentArchivePage />} />
    <Route path="*" element={<Navigate to="." replace />} />
  </Routes>
)
