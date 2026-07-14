export const PREREQUISITE_TYPES = [
  { value: 'license', label: 'رخصة سابقة' },
  { value: 'basic', label: 'متطلب أساسي' },
  { value: 'medical', label: 'متطلب طبي' },
]

export const PREREQUISITE_TYPE_SUBTITLES = {
  license: 'متطلب أساسي',
  basic: 'متطلب أساسي',
  medical: 'متطلب طبي',
}

export const PREREQUISITE_TYPE_ICONS = {
  license: 'check_circle',
  basic: 'verified',
  medical: 'medical_services',
}

export const EMPTY_PREREQUISITE = {
  label: '',
  code: '',
  isRequired: true,
  type: 'license',
}

export const normalizePrerequisite = (item) => {
  if (!item) return null
  if (typeof item === 'string') {
    const code = item.trim().toUpperCase()
    if (!code) return null
    return {
      label: `رخصة ${code} مسبقاً`,
      code,
      isRequired: true,
      type: 'license',
    }
  }
  if (typeof item !== 'object') return null

  const type = PREREQUISITE_TYPES.some((t) => t.value === item.type) ? item.type : 'license'
  const code = item.code ? String(item.code).trim().toUpperCase() : ''
  return {
    label: String(item.label || '').trim() || (code ? `رخصة ${code} مسبقاً` : 'متطلب'),
    code,
    isRequired: item.isRequired !== false,
    type,
  }
}

export const normalizePrerequisites = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map(normalizePrerequisite)
    .filter(Boolean)

export const formatPrerequisiteSummary = (items = []) => {
  const normalized = normalizePrerequisites(items)
  if (!normalized.length) return ''
  return normalized.map((item) => item.label).join('، ')
}
