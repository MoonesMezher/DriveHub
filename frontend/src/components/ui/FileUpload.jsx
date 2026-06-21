import { useRef } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'
import { Button } from './Button'

export const FileUpload = ({
  label,
  accept,
  onChange,
  hint,
  className = '',
}) => {
  const inputRef = useRef(null)

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-label-md text-on-surface">{label}</p>}
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low p-loose text-center transition-colors hover:border-primary hover:bg-surface-container"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) onChange?.(file)
        }}
      >
        <Icon name="upload_file" size={40} className="mb-3 text-primary" />
        <p className="text-body-md text-on-surface">اسحب الملف هنا أو</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
        >
          اختر ملفاً
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange?.(e.target.files?.[0])}
        />
      </div>
      {hint && <p className="text-label-sm text-on-surface-variant">{hint}</p>}
    </div>
  )
}
