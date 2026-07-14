import { apiClient, ENDPOINTS } from '@/lib/api'

export const requirementService = {
  list: () => apiClient.get(ENDPOINTS.requirements),
}
