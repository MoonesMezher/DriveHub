export const getErrorMessage = (error, fallback = 'حدث خطأ غير متوقع') => {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.data?.message || error.message || fallback
}

export const isApiError = (error, status) => {
  if (!error?.status) return false
  return status ? error.status === status : true
}
