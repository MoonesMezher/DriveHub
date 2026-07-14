export const DOCUMENT_TYPES = {
  NATIONAL_ID: 'national_id',
  MEDICAL_REPORT: 'medical_report',
  DRIVING_LICENSE: 'driving_license',
  OTHER: 'other',
}

export const REQUIRED_ENROLLMENT_DOCUMENT_TYPES = [
  DOCUMENT_TYPES.NATIONAL_ID,
  DOCUMENT_TYPES.MEDICAL_REPORT,
]

export const DOCUMENT_UPLOAD = {
  maxSizeBytes: 5 * 1024 * 1024,
  maxSizeLabel: '5 ميجابايت',
  accept: '.jpg,.jpeg,.png,.pdf',
  allowedMime: ['image/jpeg', 'image/png', 'application/pdf'],
  typeOptions: [
    { value: DOCUMENT_TYPES.NATIONAL_ID, label: 'صورة الهوية الوطنية' },
    { value: DOCUMENT_TYPES.MEDICAL_REPORT, label: 'التوثيق الطبي' },
    { value: DOCUMENT_TYPES.DRIVING_LICENSE, label: 'رخصة القيادة (إن وجدت)' },
    { value: DOCUMENT_TYPES.OTHER, label: 'مستند آخر' },
  ],
  requiredTypeOptions: [
    { value: DOCUMENT_TYPES.NATIONAL_ID, label: 'صورة الهوية الوطنية' },
    { value: DOCUMENT_TYPES.MEDICAL_REPORT, label: 'التوثيق الطبي' },
  ],
}

export const validateDocumentFile = (file) => {
  if (!file) return 'يرجى اختيار ملف'
  if (!DOCUMENT_UPLOAD.allowedMime.includes(file.type)) {
    return 'نوع الملف غير مسموح — يُقبل JPEG أو PNG أو PDF فقط'
  }
  if (file.size > DOCUMENT_UPLOAD.maxSizeBytes) {
    return `حجم الملف كبير جداً — الحد الأقصى ${DOCUMENT_UPLOAD.maxSizeLabel}`
  }
  return null
}

export const hasRequiredDocuments = (documents = []) => {
  const types = new Set(documents.map((d) => d.type))
  return REQUIRED_ENROLLMENT_DOCUMENT_TYPES.every((type) => types.has(type))
}

export const getMissingRequiredTypes = (documents = []) => {
  const types = new Set(documents.map((d) => d.type))
  return REQUIRED_ENROLLMENT_DOCUMENT_TYPES.filter((type) => !types.has(type))
}

export const documentTypeLabel = (type) =>
  DOCUMENT_UPLOAD.typeOptions.find((t) => t.value === type)?.label || type
