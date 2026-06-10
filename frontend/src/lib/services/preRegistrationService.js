import { apiClient, ENDPOINTS } from '@/lib/api'

export const preRegistrationService = {
  list: () => apiClient.get(ENDPOINTS.preRegistrations),
  create: (data) => apiClient.post(ENDPOINTS.preRegistrations, data),
  cancel: (id) => apiClient.delete(`${ENDPOINTS.preRegistrations}/${id}`),
}
