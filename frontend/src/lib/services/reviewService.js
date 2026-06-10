import { apiClient, ENDPOINTS } from '@/lib/api'

export const reviewService = {
  listBySchool: (schoolId) => apiClient.get(ENDPOINTS.reviews.bySchool(schoolId)),
  create: (data) => apiClient.post(ENDPOINTS.reviews.create, data),
}
