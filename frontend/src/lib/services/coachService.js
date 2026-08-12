import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const coachService = {
  schedule: (params) => apiClient.get(`${ENDPOINTS.coach.schedule}${buildQueryString(params)}`),
  students: () => apiClient.get(ENDPOINTS.coach.students),
  completeLesson: (id, data) => apiClient.patch(ENDPOINTS.coach.completeLesson(id), data),
  cancelLesson: (id) => apiClient.patch(ENDPOINTS.coach.cancelLesson(id)),
  postponeLesson: (id, data) => apiClient.patch(ENDPOINTS.coach.postponeLesson(id), data),
  confirmLesson: (id) => apiClient.patch(ENDPOINTS.coach.confirmLesson(id)),
  listNotes: (params) => apiClient.get(`${ENDPOINTS.coach.notes}${buildQueryString(params)}`),
  addNote: (data) => apiClient.post(ENDPOINTS.coach.notes, data),
  listQuestionBanks: () => apiClient.get(ENDPOINTS.coach.questionBanks),
  listContent: (contentType) => apiClient.get(`${ENDPOINTS.coach.content}?contentType=${contentType}`),
  requestQuestionEdit: (data) => apiClient.post(ENDPOINTS.coach.editQuestion, data),
  requestContentEdit: (data) => apiClient.post(ENDPOINTS.coach.editContent, data),
}
