import { apiClient, ENDPOINTS } from '@/lib/api'

export const verifyService = {
  statistics: (token) => apiClient.get(ENDPOINTS.verify.statistics(token)),
  certificate: (token) => apiClient.get(ENDPOINTS.verify.certificate(token)),
  roster: (token) => apiClient.get(ENDPOINTS.verify.roster(token)),
}
