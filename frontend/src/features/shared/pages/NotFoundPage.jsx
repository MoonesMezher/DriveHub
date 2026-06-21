import { Link } from 'react-router-dom'
import { Button, EmptyState, PageSection } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export const NotFoundPage = () => (
  <div className="page-container flex min-h-[70vh] items-center justify-center" dir="rtl">
    <PageSection variant="elevated" className="max-w-md text-center">
      <EmptyState
        icon="travel_explore"
        title="404 — الصفحة غير موجودة"
        description="الصفحة التي تبحث عنها غير موجودة أو نُقلت إلى عنوان آخر."
        variant="page"
        size="md"
      />
      <div className="mt-comfortable flex flex-wrap justify-center gap-3">
        <Link to={ROUTES.HOME}>
          <Button>العودة للرئيسية</Button>
        </Link>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="outline">لوحة التحكم</Button>
        </Link>
      </div>
    </PageSection>
  </div>
)
