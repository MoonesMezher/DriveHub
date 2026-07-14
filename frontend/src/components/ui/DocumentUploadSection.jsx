import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileUpload, Button, Alert, Badge, Icon } from '@/components/ui'
import { documentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { getErrorMessage } from '@/lib/helpers/error'
import {
  DOCUMENT_UPLOAD,
  validateDocumentFile,
  getMissingRequiredTypes,
  hasRequiredDocuments,
  documentTypeLabel,
} from '@/lib/constants/documentUpload'
import { formatDateTime } from '@/lib/helpers/date'

export { hasRequiredDocuments, getMissingRequiredTypes, documentTypeLabel }

const latestByType = (documents = []) => {
  const map = {}
  for (const doc of documents) {
    if (!map[doc.type]) map[doc.type] = doc
  }
  return map
}

const DocumentPreview = ({ doc }) => {
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!doc?._id) return undefined
    let active = true
    let objectUrl = null

    documentService
      .downloadBlob(doc._id)
      .then(({ blob, mime }) => {
        if (!active) return
        if (mime.startsWith('image/')) {
          objectUrl = URL.createObjectURL(blob)
          setPreviewUrl(objectUrl)
        }
      })
      .catch(() => {})

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [doc?._id])

  const handleOpen = async () => {
    try {
      const { blob } = await documentService.downloadBlob(doc._id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <div className="flex min-w-0 items-center gap-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={doc.originalName}
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
            <Icon name="description" size={28} className="text-on-surface-variant" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-label-md text-on-surface">{doc.originalName}</p>
          <p className="text-label-sm text-on-surface-variant">
            {formatDateTime(doc.uploadedAt)} — {Math.round((doc.size || 0) / 1024)} ك.ب
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleOpen}>
        عرض
      </Button>
    </div>
  )
}

const RequiredDocumentSlot = ({ type, label, uploaded, onUpload, uploading }) => {
  const [localError, setLocalError] = useState(null)

  const handleFile = (file) => {
    const err = validateDocumentFile(file)
    setLocalError(err)
    if (!err && file) onUpload(file)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-label-md text-on-surface">{label}</p>
        {uploaded ? <Badge variant="success">مرفوع</Badge> : <Badge variant="warning">مطلوب</Badge>}
      </div>
      {uploaded && <DocumentPreview doc={uploaded} />}
      <FileUpload
        accept={DOCUMENT_UPLOAD.accept}
        hint={`JPEG أو PNG أو PDF — بحد أقصى ${DOCUMENT_UPLOAD.maxSizeLabel}`}
        onChange={handleFile}
      />
      {localError && <Alert variant="error" title="خطأ في الملف">{localError}</Alert>}
      {uploading && <p className="text-label-sm text-primary">جاري الرفع…</p>}
    </div>
  )
}

export const DocumentUploadSection = ({
  title = 'المستندات',
  description,
  compact = false,
  requiredOnly = false,
}) => {
  const queryClient = useQueryClient()
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('national_id')
  const [localError, setLocalError] = useState(null)

  const docsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: async () => unwrap(await documentService.list()),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ uploadFile, type }) => documentService.upload(uploadFile, { type }),
    onSuccess: () => {
      toast.success('تم رفع المستند بنجاح')
      setFile(null)
      setLocalError(null)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const documents = docsQuery.data?.documents ?? []
  const byType = useMemo(() => latestByType(documents), [documents])
  const missingTypes = getMissingRequiredTypes(documents)
  const allRequiredPresent = hasRequiredDocuments(documents)

  if (requiredOnly) {
    return (
      <div className={compact ? 'space-y-comfortable' : 'space-y-loose'}>
        {!compact && (
          <div>
            <h3 className="text-headline-sm text-on-surface">{title}</h3>
            {description && (
              <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>
            )}
          </div>
        )}

        {!allRequiredPresent && (
          <Alert variant="warning" title="مستندات ناقصة">
            <p>
              {missingTypes.map(documentTypeLabel).join(' — ')}
              {' '}
              مطلوب قبل تقديم طلب الاشتراك.
            </p>
          </Alert>
        )}

        {allRequiredPresent && (
          <div className="flex items-center gap-2 text-success">
            <Icon name="check_circle" size={20} />
            <span className="text-label-md">جميع المستندات المطلوبة مرفوعة</span>
          </div>
        )}

        <div className="grid gap-comfortable md:grid-cols-2">
          {DOCUMENT_UPLOAD.requiredTypeOptions.map((opt) => (
            <RequiredDocumentSlot
              key={opt.value}
              type={opt.value}
              label={opt.label}
              uploaded={byType[opt.value]}
              uploading={uploadMutation.isPending && uploadMutation.variables?.type === opt.value}
              onUpload={(uploadFile) => uploadMutation.mutate({ uploadFile, type: opt.value })}
            />
          ))}
        </div>
      </div>
    )
  }

  const handleFileChange = (nextFile) => {
    const err = validateDocumentFile(nextFile)
    setLocalError(err)
    setFile(err ? null : nextFile)
  }

  const handleUpload = (e) => {
    e.preventDefault()
    const err = validateDocumentFile(file)
    if (err) {
      setLocalError(err)
      return
    }
    uploadMutation.mutate({ uploadFile: file, type: docType })
  }

  return (
    <div className={compact ? 'space-y-comfortable' : 'mt-loose space-y-comfortable'}>
      {!compact && (
        <div>
          <h3 className="text-headline-sm text-on-surface">{title}</h3>
          {description && (
            <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>
          )}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-comfortable">
        <div>
          <label htmlFor="doc-type" className="text-label-md text-on-surface">
            نوع المستند
          </label>
          <select
            id="doc-type"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md"
          >
            {DOCUMENT_UPLOAD.typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <FileUpload
          accept={DOCUMENT_UPLOAD.accept}
          hint={`JPEG أو PNG أو PDF — بحد أقصى ${DOCUMENT_UPLOAD.maxSizeLabel}`}
          onChange={handleFileChange}
        />

        {file && !localError && (
          <p className="text-label-sm text-on-surface-variant">
            الملف المختار: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}

        {localError && (
          <Alert variant="error" title="خطأ في الملف">{localError}</Alert>
        )}

        <Button type="submit" disabled={!file || Boolean(localError) || uploadMutation.isPending}>
          {uploadMutation.isPending ? 'جاري الرفع…' : 'رفع المستند'}
        </Button>
      </form>

      {documents.length > 0 && (
        <ul className="space-y-2 rounded-xl bg-surface-container p-comfortable">
          {documents.map((doc) => (
            <li key={doc._id || doc.id} className="flex flex-wrap items-center justify-between gap-2 text-body-md">
              <span>
                {documentTypeLabel(doc.type)}
                {' — '}
                {doc.originalName}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="default">{formatDateTime(doc.uploadedAt)}</Badge>
                <Badge variant="success">مشفّر</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
