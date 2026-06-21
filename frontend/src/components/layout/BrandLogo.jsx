import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

export const BrandLogo = ({ subtitle, to = ROUTES.HOME }) => (
  <Link to={to} className="flex flex-col items-center text-center">
    <img
      src="/drivehub.png"
      alt="DriveHub"
      className="mb-comfortable h-16 w-16 rounded-xl object-contain shadow-lg"
    />
    <h1 className="text-headline-md tracking-tight text-primary">DriveHub</h1>
    {subtitle && <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>}
  </Link>
)
