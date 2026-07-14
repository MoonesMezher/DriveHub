/** روابط QR للتحقق العام — تفتح صفحات الواجهة `/verify/...` وليس API مباشرة */
export const verifyUrl = (path) => {
  if (!path) return ''
  const fullPath = path.startsWith('/') ? path : `/${path}`
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${fullPath}`
  }
  return fullPath
}

export const qrImageUrl = (pathOrUrl, size = 120) => {
  const url = pathOrUrl?.startsWith('http') ? pathOrUrl : verifyUrl(pathOrUrl)
  if (!url) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`
}

export const statisticsVerifyUrl = (token) => verifyUrl(`/verify/statistics/${token}`)
export const certificateVerifyUrl = (token) => verifyUrl(`/verify/certificate/${token}`)
export const rosterVerifyUrl = (token) => verifyUrl(`/verify/roster/${token}`)
