export const IMAGE_UPLOAD = {
  accept: 'image/jpeg,image/png,image/webp',
  acceptLabel: 'JPEG أو PNG أو WebP',
  maxBytes: 5 * 1024 * 1024,
  maxSizeLabel: '5 ميجابايت',
}

export const validateImageFile = (file) => {
  if (!file) return null
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    return `نوع الصورة غير مسموح — ${IMAGE_UPLOAD.acceptLabel} فقط`
  }
  if (file.size > IMAGE_UPLOAD.maxBytes) {
    return `حجم الصورة كبير جداً — الحد الأقصى ${IMAGE_UPLOAD.maxSizeLabel}`
  }
  return null
}
