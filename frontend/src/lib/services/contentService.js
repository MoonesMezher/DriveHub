import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const contentService = {
  getSample: (params) => apiClient.get(`${ENDPOINTS.content.sample}${buildQueryString(params)}`),
}
