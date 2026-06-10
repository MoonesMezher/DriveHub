import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const coachService = {
  schedule: (params) => apiClient.get(`${ENDPOINTS.coach.schedule}${buildQueryString(params)}`),
  students: () => apiClient.get(ENDPOINTS.coach.students),
  completeLesson: (id, data) => apiClient.patch(ENDPOINTS.coach.completeLesson(id), data),
  listNotes: (params) => apiClient.get(`${ENDPOINTS.coach.notes}${buildQueryString(params)}`),
  addNote: (data) => apiClient.post(ENDPOINTS.coach.notes, data),
  requestQuestionEdit: (data) => apiClient.post(ENDPOINTS.coach.editQuestion, data),
  requestContentEdit: (data) => apiClient.post(ENDPOINTS.coach.editContent, data),
}
