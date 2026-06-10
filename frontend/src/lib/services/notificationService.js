import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const notificationService = {
  list: (params) => apiClient.get(`${ENDPOINTS.notifications}${buildQueryString(params)}`),
  markRead: (id) => apiClient.patch(`${ENDPOINTS.notifications}/${id}/read`),
  markAllRead: () => apiClient.post(`${ENDPOINTS.notifications}/read-all`),
}
