import { apiClient, ENDPOINTS } from '@/lib/api'

export const faqService = {
  list: () => apiClient.get(ENDPOINTS.faq),
}
