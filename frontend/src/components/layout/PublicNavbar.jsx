import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/constants/routes'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/hooks/useAuth'

const navLinks = [
  { to: ROUTES.HOME, label: 'الرئيسية', end: true },
  { to: ROUTES.LICENSES, label: 'الرخص' },
  { to: ROUTES.SCHOOLS_NEARBY, label: 'المدارس' },
  { to: ROUTES.REQUIREMENTS, label: 'المتطلبات' },
  { to: ROUTES.FAQ, label: 'الأسئلة الشائعة' },
]

export const PublicNavbar = () => {
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface shadow-sm">
      <div className="flex h-16 w-full items-center justify-between px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.HOME} className="text-headline-md font-bold text-primary">
            DriveHub
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'text-label-md transition-colors',
                    isActive
                      ? 'border-b-2 border-primary pb-1 text-primary'
                      : 'text-on-surface-variant hover:text-primary',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="outline" size="sm">
                  <Icon name="dashboard" size={18} />
                  لوحتي
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">دخول</Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button size="sm">تسجيل</Button>
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="القائمة"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-outline-variant bg-surface px-margin-mobile py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-label-md',
                    isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to={ROUTES.SAMPLE}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-label-md text-on-surface-variant"
            >
              عينة مجانية
            </Link>
            <Link
              to={ROUTES.ADD_SCHOOL}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-label-md text-on-surface-variant"
            >
              أضف مدرستك
            </Link>
            <div className="mt-2 flex gap-2 border-t border-outline-variant pt-4">
              {isAuthenticated ? (
                <Link to={ROUTES.DASHBOARD} className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">لوحتي</Button>
                </Link>
              ) : (
                <>
                  <Link to={ROUTES.LOGIN} className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button variant="ghost" className="w-full" size="sm">دخول</Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} className="flex-1" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full" size="sm">تسجيل</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
