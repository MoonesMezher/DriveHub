import { apiClient, ENDPOINTS } from '@/lib/api'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const documentService = {
  upload: (file, meta = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    if (meta.type) formData.append('type', meta.type)
    return apiClient.upload(ENDPOINTS.documents, formData)
  },
  list: () => apiClient.get(ENDPOINTS.documents),
  getById: (id) => apiClient.get(`${ENDPOINTS.documents}/${id}`),
  listForEnrollment: (enrollmentId) =>
    apiClient.get(`${ENDPOINTS.documents}/enrollment/${enrollmentId}`),
  downloadUrl: (id) => `${API_BASE}${ENDPOINTS.documents}/${id}/download`,
  async downloadBlob(id) {
    const token = apiClient.getToken()
    const response = await fetch(`${API_BASE}${ENDPOINTS.documents}/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const error = new Error(data.message || 'فشل تحميل المستند')
      error.status = response.status
      throw error
    }
    const blob = await response.blob()
    return {
      blob,
      mime: response.headers.get('Content-Type') || 'application/octet-stream',
    }
  },
}
