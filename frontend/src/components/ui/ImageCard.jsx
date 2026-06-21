import { Link } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Badge } from './Badge'
import { Icon } from './Icon'
import { HOME_IMAGES } from '@/lib/constants/homeVisuals'

const FALLBACK_IMAGE = HOME_IMAGES.license

const aspectRatios = {
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-video',
  hero: 'aspect-[16/10]',
  square: 'aspect-square',
}

export const ImageCard = ({
  to,
  href,
  image,
  alt = '',
  title,
  subtitle,
  badge,
  icon,
  footer,
  aspect = 'portrait',
  className = '',
  onClick,
}) => {
  const [src, setSrc] = useState(image)

  const content = (
    <>
      <div className={cn('relative overflow-hidden', aspectRatios[aspect])}>
        <img
          src={src || FALLBACK_IMAGE}
          alt={alt || title || ''}
          className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
          loading="lazy"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {badge && (
          <div className="absolute start-3 top-3">
            {typeof badge === 'string' ? (
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
                {badge}
              </Badge>
            ) : badge}
          </div>
        )}
        {icon && (
          <div className="absolute bottom-0 start-0 end-0 p-5 text-white">
            <Icon name={icon} size={24} />
          </div>
        )}
      </div>
      {(title || subtitle || footer) && (
        <div className="p-comfortable">
          {title && <h3 className="text-headline-sm text-primary">{title}</h3>}
          {subtitle && <p className="mt-1 text-body-md text-on-surface-variant">{subtitle}</p>}
          {footer}
        </div>
      )}
    </>
  )

  const classes = cn(
    'group block overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card transition duration-standard hover:-translate-y-1 hover:shadow-lg',
    className,
  )

  if (to) {
    return <Link to={to} className={classes}>{content}</Link>
  }
  if (href) {
    return <a href={href} className={classes}>{content}</a>
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(classes, 'w-full text-start')}>
        {content}
      </button>
    )
  }
  return <div className={classes}>{content}</div>
}
