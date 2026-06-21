import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const trafficService = {
  dashboard: (params) => apiClient.get(`${ENDPOINTS.traffic.dashboard}${buildQueryString(params)}`),
  listRosters: (params) => apiClient.get(`${ENDPOINTS.traffic.rosters}${buildQueryString(params)}`),
  getRoster: (id) => apiClient.get(ENDPOINTS.traffic.rosterDetail(id)),
  listSchedules: (params) => apiClient.get(`${ENDPOINTS.traffic.schedules}${buildQueryString(params)}`),
  createSchedule: (data) => apiClient.post(ENDPOINTS.traffic.schedules, data),
  updateSchedule: (id, data) => apiClient.patch(ENDPOINTS.traffic.scheduleDetail(id), data),
  listResults: (params) => apiClient.get(`${ENDPOINTS.traffic.results}${buildQueryString(params)}`),
  listEnrollments: (params) => apiClient.get(`${ENDPOINTS.traffic.enrollments}${buildQueryString(params)}`),
  enterResult: (data) => apiClient.post(ENDPOINTS.traffic.results, data),
  bulkEnterResults: (rows) => apiClient.post(ENDPOINTS.traffic.resultsBulk, { rows }),
  issueLicense: (data) => apiClient.post(ENDPOINTS.traffic.licenses, data),
}
