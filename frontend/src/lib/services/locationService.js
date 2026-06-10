import { apiClient, ENDPOINTS } from '@/lib/api'

export const locationService = {
  save: (data) => apiClient.post(ENDPOINTS.location, data),
  getLatest: () => apiClient.get(ENDPOINTS.location),
}
