import { Button } from './Button'
import { Dialog } from './Dialog'
import { Icon } from './Icon'

export const ConfirmDialog = ({
  open,
  title = 'تأكيد',
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} size="md">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <Icon name="help" size={22} />
      </span>
      <div>
        <h2 id="confirm-dialog-title" className="text-headline-sm text-on-surface">
          {title}
        </h2>
        {message && (
          <p className="mt-2 text-body-md text-on-surface-variant">{message}</p>
        )}
      </div>
    </div>
    <div className="mt-loose flex flex-wrap justify-end gap-2">
      <Button variant="ghost" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant={variant} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Dialog>
)
