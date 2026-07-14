import { apiClient, ENDPOINTS } from '@/lib/api'

export const testimonialService = {
  list: () => apiClient.get(ENDPOINTS.testimonials),
}
