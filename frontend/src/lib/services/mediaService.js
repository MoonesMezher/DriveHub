import { apiClient, ENDPOINTS } from '@/lib/api'
import { unwrap } from '@/lib/helpers/api'

export const mediaService = {
  upload: (file, { category = 'general' } = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    if (category) formData.append('category', category)
    return apiClient.upload(ENDPOINTS.media.upload, formData).then(unwrap)
  },
}
