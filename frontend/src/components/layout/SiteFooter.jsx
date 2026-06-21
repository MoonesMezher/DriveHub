import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'
import { Icon } from '@/components/ui/Icon'
import { PUBLIC_FOOTER_NAV } from '@/lib/design/navigation'

export const SiteFooter = ({ variant = 'full' }) => {
  const year = new Date().getFullYear()
  const compact = variant === 'compact'

  if (compact) {
    return (
      <footer className="mt-auto border-t border-outline-variant/60 bg-surface-container-lowest">
        <div className="flex flex-col items-center justify-between gap-2 px-margin-mobile py-3 text-label-sm text-on-surface-variant sm:flex-row sm:px-margin-desktop">
          <p>© {year} DriveHub. جميع الحقوق محفوظة.</p>
          <Link to={ROUTES.PRIVACY} className="transition-colors hover:text-primary">
            سياسة الخصوصية
          </Link>
        </div>
      </footer>
    )
  }

  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-lowest">
      <div className="page-container py-loose">
        <div className="grid gap-loose md:grid-cols-3">
          <div className="max-w-sm">
            <Link to={ROUTES.HOME} className="flex items-center gap-2">
              <img src="/drivehub.png" alt="" className="h-8 w-8 rounded-lg" />
              <span className="text-headline-sm font-bold text-primary">DriveHub</span>
            </Link>
            <p className="mt-3 text-body-md text-on-surface-variant">
              منصة موحّدة لتعليم القيادة — إدارة المدارس، الاشتراكات، والامتحانات في مكان واحد.
            </p>
            <div className="mt-4 flex gap-3 text-on-surface-variant">
              <Icon name="share" size={20} className="opacity-60" />
              <Icon name="mail" size={20} className="opacity-60" />
              <Icon name="language" size={20} className="opacity-60" />
            </div>
          </div>

          <nav className="md:col-span-2">
            <p className="mb-3 text-label-md font-semibold text-on-surface">روابط سريعة</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {PUBLIC_FOOTER_NAV.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-label-md text-on-surface-variant transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-loose flex flex-col gap-3 border-t border-outline-variant/60 pt-comfortable sm:flex-row sm:items-center sm:justify-between">
          <p className="text-label-sm text-on-surface-variant">
            © {year} DriveHub. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <Icon name="verified_user" size={16} className="text-primary" />
            <span>منصة آمنة لإدارة مدارس تعليم القيادة</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
