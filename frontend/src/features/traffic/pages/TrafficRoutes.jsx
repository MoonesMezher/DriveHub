import { Routes, Route, Navigate } from 'react-router-dom'
import { TrafficRostersPage } from './TrafficRostersPage'
import { TrafficSchedulesPage } from './TrafficSchedulesPage'
import { TrafficResultsPage } from './TrafficResultsPage'

export const TrafficRoutes = () => (
  <Routes>
    <Route index element={<TrafficRostersPage />} />
    <Route path="schedules" element={<TrafficSchedulesPage />} />
    <Route path="results" element={<TrafficResultsPage />} />
    <Route path="*" element={<Navigate to="" replace />} />
  </Routes>
)
