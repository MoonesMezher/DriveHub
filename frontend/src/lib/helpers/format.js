export const formatCurrency = (amount, currency = 'SYP') => {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPhone = (phone) => {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

export const truncate = (text, max = 80) => {
  if (!text || text.length <= max) return text || ''
  return `${text.slice(0, max)}…`
}

export const fullName = (user) => {
  if (!user) return ''
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || ''
}
