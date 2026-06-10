import { apiClient, ENDPOINTS } from '@/lib/api'

export const schoolApplicationService = {
  submit: (data) => apiClient.post(ENDPOINTS.schoolApplications, data),
  listMine: () => apiClient.get(ENDPOINTS.schoolApplications),
}
