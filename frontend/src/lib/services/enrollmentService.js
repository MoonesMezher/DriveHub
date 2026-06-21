import { apiClient, ENDPOINTS } from '@/lib/api'

export const enrollmentService = {
  list: () => apiClient.get(ENDPOINTS.enrollments.list),
  create: (data) => apiClient.post(ENDPOINTS.enrollments.create, data),
  createRetake: (data) => apiClient.post(ENDPOINTS.enrollments.retake, data),
  getById: (id) => apiClient.get(ENDPOINTS.enrollments.detail(id)),
  cancel: (id) => apiClient.delete(ENDPOINTS.enrollments.detail(id)),
  initiatePayment: (id) => apiClient.post(ENDPOINTS.enrollments.paymentInitiate(id)),
  confirmPayment: (id, amount, gatewayRef) =>
    apiClient.post(ENDPOINTS.enrollments.paymentConfirm(id), { amount, gatewayRef }),
  initiateRetakePayment: (id) => apiClient.post(ENDPOINTS.enrollments.retakePaymentInitiate(id)),
  confirmRetakePayment: (id, amount, gatewayRef) =>
    apiClient.post(ENDPOINTS.enrollments.retakePaymentConfirm(id), { amount, gatewayRef }),
}
