import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/helpers/error'

export const useToast = () => ({
  success: (message) => toast.success(message),
  error: (error, fallback) => toast.error(getErrorMessage(error, fallback)),
  info: (message) => toast.info(message),
  promise: (promise, messages) => toast.promise(promise, messages),
})
