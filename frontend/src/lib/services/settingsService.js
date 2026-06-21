import { apiClient, ENDPOINTS } from '@/lib/api'

export const settingsService = {
  getPrivacy: () => apiClient.get(ENDPOINTS.settings.privacy),
}
