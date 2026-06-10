export const unwrap = (response) => response?.data ?? response

export const unwrapList = (response, keys = ['items', 'courses', 'coaches', 'enrollments', 'reviews']) => {
  const data = unwrap(response)
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}
