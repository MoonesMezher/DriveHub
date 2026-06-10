import { Badge } from './Badge'
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_STATUS_VARIANT } from '@/lib/constants/statusLabels'

export const StatusBadge = ({ status, labels = ENROLLMENT_STATUS_LABELS, variants = ENROLLMENT_STATUS_VARIANT }) => (
  <Badge variant={variants[status] || 'default'} dot>
    {labels[status] || status}
  </Badge>
)
