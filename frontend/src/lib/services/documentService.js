import { apiClient, ENDPOINTS } from '@/lib/api'

export const documentService = {
  upload: (file, meta = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    if (meta.type) formData.append('type', meta.type)
    if (meta.label) formData.append('label', meta.label)
    return apiClient.upload(ENDPOINTS.documents, formData)
  },
  getById: (id) => apiClient.get(`${ENDPOINTS.documents}/${id}`),
}
