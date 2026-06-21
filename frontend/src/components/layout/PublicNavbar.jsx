import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/constants/routes'
import { Button, Icon } from '@/components/ui'
import { PUBLIC_NAV } from '@/lib/design/navigation'
import { useAuth } from '@/hooks/useAuth'

export const PublicNavbar = () => {
  const { isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-outline-variant/80">
      <div className="page-container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.HOME} className="flex shrink-0 items-center gap-2">
            <img src="/drivehub.png" alt="DriveHub" className="h-9 w-9 rounded-xl object-contain" />
            <span className="hidden text-headline-sm font-bold text-primary sm:inline">DriveHub</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {PUBLIC_NAV.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-label-md transition-colors',
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to={ROUTES.DASHBOARD}>
              <Button size="sm">لوحتي</Button>
            </Link>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="hidden sm:block">
                <Button variant="ghost" size="sm">تسجيل الدخول</Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button size="sm">ابدأ مجاناً</Button>
              </Link>
            </>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="القائمة"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-outline-variant bg-surface-container-lowest px-4 py-3 md:hidden">
          {PUBLIC_NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2.5 text-label-md',
                  isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
