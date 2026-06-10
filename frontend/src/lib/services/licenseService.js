import { apiClient, ENDPOINTS } from '@/lib/api'

export const licenseService = {
  list: () => apiClient.get(ENDPOINTS.licenses),
  getByCode: (code) => apiClient.get(`${ENDPOINTS.licenses}/${code}`),
}
