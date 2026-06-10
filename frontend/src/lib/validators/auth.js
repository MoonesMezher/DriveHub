import { z } from 'zod'
import { passwordSchema, phoneSchema } from './common'

export const loginSchema = z.object({
  identifier: z.string().min(3, 'أدخل البريد أو اسم المستخدم'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
  portal: z.enum(['student', 'school', 'admin']),
})

export const registerSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم قصير جداً'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: passwordSchema,
  phone: phoneSchema,
  firstName: z.string().min(2, 'الاسم الأول مطلوب'),
  lastName: z.string().min(2, 'اسم العائلة مطلوب'),
})
