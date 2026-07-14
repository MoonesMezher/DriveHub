/**
 * يحوّل مرجع الصورة المخزّن في API إلى عنوان قابل للعرض.
 * يدعم بيانات البذرة الخارجية (dev) ومسارات /api/v1/media/:id
 */
export const resolveMediaUrl = (value) => {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/api/v1/media/')) return trimmed
  if (/^[a-f0-9]{24}$/i.test(trimmed)) return `/api/v1/media/${trimmed}`
  return trimmed
}
