import { useState } from 'react'
import { cn } from '@/lib/cn'
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'

const FALLBACK = HOME_IMAGES.license

export const SafeImage = ({
  src,
  alt = '',
  className = '',
  fallback = FALLBACK,
  loading = 'lazy',
  ...props
}) => {
  const [resolved, setResolved] = useState(src || fallback)

  return (
    <img
      src={resolved || fallback}
      alt={alt}
      className={cn(className)}
      loading={loading}
      onError={() => setResolved(fallback)}
      {...props}
    />
  )
}
