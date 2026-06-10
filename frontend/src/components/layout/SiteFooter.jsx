import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'
import { Icon } from '@/components/ui/Icon'

const footerLinks = [
  { to: ROUTES.HOME, label: 'الرئيسية' },
  { to: ROUTES.LICENSES, label: 'الرخص' },
  { to: ROUTES.SCHOOLS_NEARBY, label: 'المدارس' },
  { to: ROUTES.REQUIREMENTS, label: 'المتطلبات' },
  { to: ROUTES.FAQ, label: 'الأسئلة الشائعة' },
  { to: ROUTES.SAMPLE, label: 'عينة مجانية' },
]

export const SiteFooter = ({ compact = false }) => {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-lowest">
      <div className="page-container px-margin-mobile py-loose md:px-margin-desktop">
        <div className={`flex flex-col gap-loose ${compact ? '' : 'md:flex-row md:items-start md:justify-between'}`}>
          <div className="max-w-sm">
            <Link to={ROUTES.HOME} className="text-headline-sm font-bold text-primary">
              DriveHub
            </Link>
            <p className="mt-2 text-body-md text-on-surface-variant">
              منصة موحّدة لتعليم القيادة — إدارة المدارس، الاشتراكات، والامتحانات في مكان واحد.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-label-md text-on-surface-variant transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
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
