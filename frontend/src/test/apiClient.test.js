import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiClient } from '@/lib/api/client'

describe('ApiClient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('stores access and refresh tokens', () => {
    const client = new ApiClient('/api/v1')
    client.setTokens({ accessToken: 'access', refreshToken: 'refresh' })
    expect(client.getToken()).toBe('access')
    expect(client.getRefreshToken()).toBe('refresh')
    client.clearTokens()
    expect(client.getToken()).toBeNull()
  })

  it('sends authorization header when token exists', async () => {
    const client = new ApiClient('/api/v1')
    client.setTokens({ accessToken: 'test-token' })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    await client.get('/health')

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })
})
