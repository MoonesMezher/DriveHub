import { Link } from 'react-router-dom'
import { PageHeader, Card, Button, Icon } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export const NotFoundPage = () => (
  <div className="page-container flex min-h-[70vh] items-center justify-center" dir="rtl">
    <Card className="max-w-md text-center" padding="lg">
      <div className="mx-auto mb-comfortable flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-container text-primary">
        <Icon name="search_off" size={40} />
      </div>
      <PageHeader title="404" description="الصفحة التي تبحث عنها غير موجودة أو نُقلت." size="md" />
      <div className="mt-comfortable flex flex-wrap justify-center gap-3">
        <Link to={ROUTES.HOME}>
          <Button>العودة للرئيسية</Button>
        </Link>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="outline">لوحة التحكم</Button>
        </Link>
      </div>
    </Card>
  </div>
)
