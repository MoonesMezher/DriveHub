export const parsePaginationMeta = (meta) => ({
  page: meta?.pagination?.page ?? 1,
  limit: meta?.pagination?.limit ?? 20,
  total: meta?.pagination?.total ?? 0,
  totalPages: meta?.pagination?.totalPages ?? 1,
})

export const buildQueryString = (params = {}) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
