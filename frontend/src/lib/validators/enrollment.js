import { z } from 'zod'

export const enrollmentRequestSchema = z.object({
  courseId: z.string().min(1, 'اختر الدورة'),
  schoolId: z.string().min(1, 'اختر المدرسة'),
  categoryCode: z.string().min(1, 'اختر نوع الرخصة'),
  subTypeCode: z.string().optional(),
  prefersFemaleCoach: z.boolean().optional(),
})
