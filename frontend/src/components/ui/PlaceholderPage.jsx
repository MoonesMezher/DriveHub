import { PageHeader } from './PageHeader'
import { Card } from './Card'

export const PlaceholderPage = ({ title, description, module }) => (
  <div>
    <PageHeader title={title} description={description} />
    <Card>
      <p className="text-body-md text-on-surface-variant">
        وحدة <strong className="text-on-surface">{module}</strong> — جاهزة للتطوير ضمن نظام التصميم
        الموحّد.
      </p>
    </Card>
  </div>
)
