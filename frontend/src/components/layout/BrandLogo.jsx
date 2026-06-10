import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { ROUTES } from '@/lib/constants/routes'

export const BrandLogo = ({ subtitle, to = ROUTES.HOME }) => (
  <Link to={to} className="flex flex-col items-center text-center">
    <div className="mb-comfortable flex h-16 w-16 items-center justify-center rounded-xl bg-primary shadow-lg">
      <Icon name="directions_car" className="text-on-primary" size={40} />
    </div>
    <h1 className="text-headline-md tracking-tight text-primary">DriveHub</h1>
    {subtitle && <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>}
  </Link>
)
