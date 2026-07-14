import { apiClient, ENDPOINTS } from '@/lib/api'

export const enrollmentService = {
  list: () => apiClient.get(ENDPOINTS.enrollments.list),
  create: (data) => apiClient.post(ENDPOINTS.enrollments.create, data),
  createRetake: (data) => apiClient.post(ENDPOINTS.enrollments.retake, data),
  getById: (id) => apiClient.get(ENDPOINTS.enrollments.detail(id)),
  cancel: (id) => apiClient.delete(ENDPOINTS.enrollments.detail(id)),
  initiatePayment: (id) => apiClient.post(ENDPOINTS.enrollments.paymentInitiate(id)),
  claimPayment: (id, studentReference) =>
    apiClient.post(ENDPOINTS.enrollments.paymentClaim(id), { studentReference }),
  payFromWallet: (id) => apiClient.post(ENDPOINTS.enrollments.payFromWallet(id)),
  initiateRetakePayment: (id) => apiClient.post(ENDPOINTS.enrollments.retakePaymentInitiate(id)),
  claimRetakePayment: (id, studentReference) =>
    apiClient.post(ENDPOINTS.enrollments.retakePaymentClaim(id), { studentReference }),
  payRetakeFromWallet: (id) => apiClient.post(ENDPOINTS.enrollments.retakePayFromWallet(id)),
}
