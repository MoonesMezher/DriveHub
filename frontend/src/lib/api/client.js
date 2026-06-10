const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const ACCESS_KEY = 'drivehub_access_token'
const REFRESH_KEY = 'drivehub_refresh_token'

class ApiClient {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl
    this.onUnauthorized = null
    this.refreshPromise = null
  }

  getToken() {
    return localStorage.getItem(ACCESS_KEY)
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY)
  }

  setTokens({ accessToken, refreshToken, token }) {
    const access = accessToken || token
    if (access) localStorage.setItem(ACCESS_KEY, access)
    else localStorage.removeItem(ACCESS_KEY)
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    else localStorage.removeItem(REFRESH_KEY)
  }

  /** @deprecated */
  setToken(token) {
    this.setTokens({ accessToken: token })
  }

  clearTokens() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  setOnUnauthorized(handler) {
    this.onUnauthorized = handler
  }

  async refreshAccessToken() {
    if (this.refreshPromise) return this.refreshPromise

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Refresh failed')
        this.setTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        })
        return data.data
      })
      .finally(() => {
        this.refreshPromise = null
      })

    return this.refreshPromise
  }

  async request(path, options = {}, retry = true) {
    const isFormData = options.body instanceof FormData
    const headers = { ...options.headers }

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    const token = this.getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(`${this.baseUrl}${path}`, { ...options, headers })
    const data = await response.json().catch(() => ({}))

    if (response.status === 401 && retry && this.getRefreshToken() && !path.includes('/auth/refresh')) {
      try {
        await this.refreshAccessToken()
        return this.request(path, options, false)
      } catch {
        this.clearTokens()
        this.onUnauthorized?.()
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || 'Request failed')
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  }

  get(path) {
    return this.request(path)
  }

  post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) })
  }

  patch(path, body) {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) })
  }

  upload(path, formData) {
    return this.request(path, { method: 'POST', body: formData })
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' })
  }
}

export { ApiClient }
export const apiClient = new ApiClient()
export default apiClient
