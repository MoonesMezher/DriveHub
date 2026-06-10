import { apiClient, ENDPOINTS } from '@/lib/api'

export const profileService = {
  get: () => apiClient.get(ENDPOINTS.profile),
  update: (data) => apiClient.patch(ENDPOINTS.profile, data),
}
