import { useQuery } from '@tanstack/react-query'
import { Button, Alert, Badge, Icon } from '@/components/ui'
import { documentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import { documentTypeLabel } from '@/lib/constants/documentUpload'

export const EnrollmentDocumentsPanel = ({ enrollmentId, onClose }) => {
  const docsQuery = useQuery({
    queryKey: ['manager', 'enrollmentDocuments', enrollmentId],
    queryFn: () => documentService.listForEnrollment(enrollmentId).then(unwrap),
    enabled: Boolean(enrollmentId),
  })

  const documents = docsQuery.data?.documents ?? []

  const handleOpen = async (docId) => {
    try {
      const { blob } = await documentService.downloadBlob(docId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      console.error(getErrorMessage(err))
    }
  }

  if (docsQuery.isLoading) {
    return <p className="text-label-sm text-on-surface-variant">جاري تحميل المستندات…</p>
  }

  if (docsQuery.error) {
    return <Alert variant="error" title="تعذّر تحميل المستندات">{getErrorMessage(docsQuery.error)}</Alert>
  }

  return (
    <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-comfortable">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-md font-medium text-on-surface">مستندات الطالب</p>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" size={18} />
          </Button>
        )}
      </div>
      {documents.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">لا توجد مستندات مرفوعة</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container p-3"
            >
              <div className="min-w-0">
                <p className="text-label-md text-on-surface">{documentTypeLabel(doc.type)}</p>
                <p className="truncate text-label-sm text-on-surface-variant">{doc.originalName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">مشفّر</Badge>
                <Button type="button" size="sm" variant="outline" onClick={() => handleOpen(doc._id)}>
                  عرض
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
