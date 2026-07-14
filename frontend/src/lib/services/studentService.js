import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const studentService = {
  dashboard: () => apiClient.get(ENDPOINTS.student.dashboard),
  archive: () => apiClient.get(ENDPOINTS.student.archive),
  statistics: () => apiClient.get(ENDPOINTS.student.statistics),
  listTheory: (params) => apiClient.get(`${ENDPOINTS.student.theory}${buildQueryString(params)}`),
  getTheory: (id) => apiClient.get(ENDPOINTS.student.theoryDetail(id)),
  completeTheory: (id) => apiClient.post(ENDPOINTS.student.theoryComplete(id)),
  listShared: (params) => apiClient.get(`${ENDPOINTS.student.shared}${buildQueryString(params)}`),
  listSpecific: (params) => apiClient.get(`${ENDPOINTS.student.specific}${buildQueryString(params)}`),
  listVideos: (params) => apiClient.get(`${ENDPOINTS.student.videos}${buildQueryString(params)}`),
  getUnlock: (params) => apiClient.get(`${ENDPOINTS.student.unlock}${buildQueryString(params)}`),
  setUnlock: (data) => apiClient.post(ENDPOINTS.student.unlock, data),
  startPractice: (data) => apiClient.post(ENDPOINTS.student.practiceStart, data),
  submitPractice: (data) => apiClient.post(ENDPOINTS.student.practiceSubmit, data),
  listPractice: () => apiClient.get(ENDPOINTS.student.practice),
  examInfo: () => apiClient.get(ENDPOINTS.student.examInfo),
  certificates: () => apiClient.get(ENDPOINTS.student.certificates),
  listLessons: () => apiClient.get(ENDPOINTS.student.lessons),
  bookLesson: (data) => apiClient.post(ENDPOINTS.student.lessons, data),
  autoBookLesson: (data) => apiClient.post(ENDPOINTS.student.autoBookLesson, data),
  eligibleCoaches: (enrollmentId) =>
    apiClient.get(`${ENDPOINTS.student.eligibleCoaches}?enrollmentId=${enrollmentId}`),
}
