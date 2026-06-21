const EN_LOCALE = 'en-US'

export const formatNumber = (value, options = {}) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat(EN_LOCALE, options).format(Number(value))
}

export const formatCurrency = (amount, currency = 'SYP') => {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return new Intl.NumberFormat(EN_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercent = (value, { digits = 1 } = {}) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${formatNumber(Number(value) * 100, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
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
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.name || ''
}
