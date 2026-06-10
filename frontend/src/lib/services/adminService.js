import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const adminService = {
  listPricing: () => apiClient.get(ENDPOINTS.admin.pricing),
  upsertPricing: (data) => apiClient.put(ENDPOINTS.admin.pricing, data),
  updateCommission: (commission) => apiClient.patch(ENDPOINTS.admin.commission, { commission }),
  listSchools: (params) => apiClient.get(`${ENDPOINTS.admin.schools}${buildQueryString(params)}`),
  createSchool: (data) => apiClient.post(ENDPOINTS.admin.schools, data),
  updateSchool: (id, data) => apiClient.patch(ENDPOINTS.admin.schoolDetail(id), data),
  listApplications: () => apiClient.get(ENDPOINTS.admin.applications),
  reviewApplication: (id, data) => apiClient.post(ENDPOINTS.admin.reviewApplication(id), data),
  listUsers: (params) => apiClient.get(`${ENDPOINTS.admin.users}${buildQueryString(params)}`),
  assignRole: (data) => apiClient.post(ENDPOINTS.admin.assignRole, data),
  suspendUser: (id, data) => apiClient.patch(ENDPOINTS.admin.suspendUser(id), data),
  listAds: () => apiClient.get(ENDPOINTS.admin.ads),
  createAd: (data) => apiClient.post(ENDPOINTS.admin.ads, data),
  distributeRosters: (data) => apiClient.post(ENDPOINTS.admin.distributeRosters, data),
  auditLogs: (params) => apiClient.get(`${ENDPOINTS.admin.audit}${buildQueryString(params)}`),
  reports: (params) => apiClient.get(`${ENDPOINTS.admin.reports}${buildQueryString(params)}`),
  pendingReviews: () => apiClient.get(ENDPOINTS.admin.reviewsPending),
  moderateReview: (id, adminStatus) =>
    apiClient.patch(ENDPOINTS.admin.moderateReview(id), { adminStatus }),
}
