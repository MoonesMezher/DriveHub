import { z } from 'zod'

export const phoneSchema = z
  .string()
  .min(8, 'رقم الهاتف غير صالح')
  .regex(/^\+?[0-9]{8,15}$/, 'رقم الهاتف غير صالح')

export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
  .regex(/\d/, 'يجب أن تحتوي على رقم')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
