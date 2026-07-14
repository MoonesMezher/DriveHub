import { apiClient, ENDPOINTS } from '@/lib/api'

export const authService = {
  login: (credentials) => apiClient.post(ENDPOINTS.auth.login, credentials),
  register: (payload) => apiClient.post(ENDPOINTS.auth.register, payload),
  forgotPassword: (payload) => apiClient.post(ENDPOINTS.auth.forgotPassword, payload),
  verifyResetCode: (payload) => apiClient.post(ENDPOINTS.auth.verifyResetCode, payload),
  resetPassword: (payload) => apiClient.post(ENDPOINTS.auth.resetPassword, payload),
  logout: () => apiClient.post(ENDPOINTS.auth.logout, { refreshToken: apiClient.getRefreshToken() }),
  me: () => apiClient.get(ENDPOINTS.auth.me),
  contexts: () => apiClient.get(ENDPOINTS.auth.contexts),
  switchContext: (role, schoolId) =>
    apiClient.post(ENDPOINTS.auth.switchContext, { role, schoolId }),
}
