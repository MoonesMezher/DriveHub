import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const schoolService = {
  getMap: (params) => apiClient.get(`${ENDPOINTS.schools.map}${buildQueryString(params)}`),
  getNearby: (params) => apiClient.get(`${ENDPOINTS.schools.nearby}${buildQueryString(params)}`),
  getById: (id) => apiClient.get(ENDPOINTS.schools.detail(id)),
  getCourses: (id, params) =>
    apiClient.get(`${ENDPOINTS.schools.courses(id)}${buildQueryString(params)}`),
  getCoaches: (id) => apiClient.get(ENDPOINTS.schools.coaches(id)),
}
