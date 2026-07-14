/** أسباب الرفض المعيارية — الخطة v3.2 (3 أسباب + نص حر) */
export const ENROLLMENT_REJECTION_REASONS = [
  {
    value: 'no_capacity',
    label: 'لا توجد أماكن متاحة في الدورة الحالية',
    message: 'لا توجد أماكن متاحة في الدورة الحالية. يمكنك التقديم لمدرسة أخرى أو الحجز المسبق للدورة القادمة.',
  },
  {
    value: 'registration_stopped',
    label: 'التسجيل موقوف حالياً من الإدارة',
    message: 'التسجيل موقوف حالياً من إدارة المدرسة/المنصة. يمكنك التقديم لمدرسة أخرى الآن أو الانتظار حتى إعادة فتح التسجيل.',
  },
  {
    value: 'launch_window_blocked',
    label: 'لا يمكن فتح دورة جديدة قبل اكتمال مدة 15 يوماً',
    message: 'لا يمكن فتح دورة جديدة حالياً بسبب شرط مرور 15 يوماً من الإطلاق السابق. يمكنك الحجز المسبق (إن كان مفعلاً) أو التقديم لمدرسة أخرى.',
  },
  {
    value: 'incomplete_documents',
    label: 'المستندات غير مكتملة أو غير واضحة',
    message: 'المستندات المرفقة غير مكتملة أو غير واضحة. يرجى تحديث الهوية والفحص الطبي ثم إعادة التقديم.',
  },
  {
    value: 'requirements_not_met',
    label: 'لا يلبي متطلبات الفئة أو السن',
    message: 'لا تستوفي متطلبات فئة الرخصة أو الحد الأدنى للعمر. راجع صفحة المتطلبات أو اختر فئة أخرى.',
  },
]

export const resolveRejectionMessage = (reasonKey, customText) => {
  const preset = ENROLLMENT_REJECTION_REASONS.find((r) => r.value === reasonKey)
  if (preset) return preset.message
  return customText?.trim() || 'لم يتم قبول طلب الاشتراك.'
}
