import { Link } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/lib/constants/routes'

export const UnauthorizedPage = () => {
  const { getHomeRoute } = useAuth()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-comfortable" dir="rtl">
      <Card className="max-w-md text-center">
        <h1 className="text-headline-md text-error">403 — غير مصرّح</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          لا تملك الصلاحية للوصول إلى هذه الصفحة ضمن السياق الحالي.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={getHomeRoute()}>
            <Button>العودة للوحة الرئيسية</Button>
          </Link>
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="outline">لوحة التحكم</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
