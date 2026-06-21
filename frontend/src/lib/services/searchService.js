import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const searchService = {
  global: (q) => apiClient.get(`${ENDPOINTS.search}${buildQueryString({ q })}`),
}
