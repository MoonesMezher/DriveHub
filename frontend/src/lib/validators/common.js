import { z } from 'zod'

export const DIGITS_IN_NAME_REGEX = /[\d\u0660-\u0669]/
export const DIGITS_ONLY_REGEX = /^\d+$/

export const stripNonDigits = (value) => String(value ?? '').replace(/[^\d]/g, '')

export const hasDigitsInName = (value) => DIGITS_IN_NAME_REGEX.test(String(value ?? ''))

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

export const personNameSchema = z
  .string()
  .min(2, 'الاسم قصير جداً')
  .refine((value) => !hasDigitsInName(value), 'الاسم لا يجوز أن يحتوي على أرقام')

export const nationalIdSchema = z
  .string()
  .min(1, 'الرقم الوطني مطلوب')
  .regex(DIGITS_ONLY_REGEX, 'الرقم الوطني يجب أن يكون أرقاماً فقط')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
