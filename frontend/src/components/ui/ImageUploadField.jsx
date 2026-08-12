import { useEffect, useState } from 'react'
import { FileUpload } from './FileUpload'
import { Alert } from './Alert'
import { Button } from './Button'
import { IMAGE_UPLOAD, validateImageFile } from '@/lib/constants/imageUpload'
import { resolveMediaUrl } from '@/lib/helpers/mediaUrl'
import { getErrorMessage } from '@/lib/helpers/error'

export const ImageUploadField = ({
  label = 'صورة',
  hint,
  value,
  onChange,
  onUpload,
  onRemove,
  uploading = false,
  removing = false,
  category = 'general',
  className = '',
}) => {
  const [localError, setLocalError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return undefined
    }
    const resolved = resolveMediaUrl(value)
    setPreviewUrl(resolved)
    return undefined
  }, [value])

  const handleFile = async (file) => {
    const err = validateImageFile(file)
    setLocalError(err)
    if (err || !file) return

    if (onUpload) {
      try {
        await onUpload(file, category)
        setLocalError(null)
      } catch (uploadErr) {
        setLocalError(getErrorMessage(uploadErr))
      }
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    onChange?.(objectUrl)
  }

  const handleRemove = async () => {
    if (!onRemove) {
      setPreviewUrl(null)
      onChange?.('')
      return
    }
    try {
      await onRemove()
      setLocalError(null)
    } catch (removeErr) {
      setLocalError(getErrorMessage(removeErr))
    }
  }

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const busy = uploading || removing
  const hasImage = Boolean(previewUrl)

  return (
    <div className={className}>
      <FileUpload
        label={label}
        accept={IMAGE_UPLOAD.accept}
        hint={
          hint
          || (hasImage
            ? 'اختر صورة جديدة لاستبدال الحالية'
            : `${IMAGE_UPLOAD.acceptLabel} — بحد أقصى ${IMAGE_UPLOAD.maxSizeLabel}`)
        }
        onChange={handleFile}
      />
      {previewUrl && (
        <div className="mt-3 space-y-2">
          <img
            src={previewUrl}
            alt="معاينة"
            className="max-h-40 w-full rounded-xl border border-outline-variant object-contain"
          />
          {onRemove && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={handleRemove}
            >
              {removing ? 'جاري الحذف…' : 'حذف الصورة'}
            </Button>
          )}
        </div>
      )}
      {uploading && <p className="mt-2 text-label-sm text-primary">جاري رفع الصورة…</p>}
      {localError && (
        <Alert variant="error" title="خطأ في الصورة" className="mt-3">
          {localError}
        </Alert>
      )}
    </div>
  )
}
