export const rosterVerifyUrl = (token) => {
  if (!token) return ''
  const apiBase = import.meta.env.VITE_API_URL || '/api/v1'
  const path = `${apiBase.replace(/\/$/, '')}/rosters/verify/${token}`
  if (path.startsWith('http')) return path
  return `${window.location.origin}${path}`
}

export const rosterQrImageUrl = (token, size = 120) => {
  const url = rosterVerifyUrl(token)
  if (!url) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`
}
