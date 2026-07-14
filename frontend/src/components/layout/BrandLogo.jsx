import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

export const BrandLogo = ({ subtitle, to = ROUTES.HOME, compact = false }) => (
  <Link
    to={to}
    className={
      compact
        ? 'flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90'
        : 'flex flex-col items-center text-center transition-opacity hover:opacity-90'
    }
  >
    <img
      src="/drivehub.png"
      alt="DriveHub"
      className={
        compact
          ? 'h-9 w-9 rounded-xl object-contain'
          : 'mb-comfortable h-16 w-16 rounded-xl object-contain shadow-lg'
      }
    />
    <span className={compact ? 'text-headline-sm font-bold text-primary' : 'text-headline-md tracking-tight text-primary'}>
      DriveHub
    </span>
    {!compact && subtitle && <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>}
  </Link>
)
