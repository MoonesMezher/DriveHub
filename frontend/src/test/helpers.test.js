import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'
import { buildQueryString, parsePaginationMeta } from '@/lib/helpers/pagination'
import { getErrorMessage } from '@/lib/helpers/error'

describe('helpers', () => {
  it('cn merges tailwind classes', () => {
    expect(cn('px-2', 'px-4', false && 'hidden')).toBe('px-4')
  })

  it('buildQueryString skips empty values', () => {
    expect(buildQueryString({ lat: 33.5, lng: 36.2, page: 1, q: '' })).toBe('?lat=33.5&lng=36.2&page=1')
  })

  it('parsePaginationMeta returns defaults', () => {
    expect(parsePaginationMeta({})).toEqual({ page: 1, limit: 20, total: 0, totalPages: 1 })
  })

  it('getErrorMessage extracts API message', () => {
    expect(getErrorMessage({ message: 'fail', data: { message: 'api fail' } })).toBe('api fail')
  })
})
