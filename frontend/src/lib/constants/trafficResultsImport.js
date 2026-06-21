/** أعمدة ملف Excel المطلوبة لرفع نتائج الامتحان دفعة واحدة */
export const TRAFFIC_RESULTS_IMPORT_COLUMNS = [
  {
    key: 'studentEmail',
    label: 'البريد الإلكتروني',
    type: 'نص (بريد إلكتروني)',
    required: true,
    example: 'activestudent@drivehub.local',
    aliases: ['studentEmail', 'email', 'البريد_الإلكتروني', 'البريد الإلكتروني'],
  },
  {
    key: 'categoryCode',
    label: 'فئة الرخصة',
    type: 'نص (B, C, A, ...)',
    required: true,
    example: 'B',
    aliases: ['categoryCode', 'category', 'فئة_الرخصة', 'فئة الرخصة'],
  },
  {
    key: 'examType',
    label: 'نوع الامتحان',
    type: 'نص: theory / practical أو نظري / عملي',
    required: true,
    example: 'theory',
    aliases: ['examType', 'نوع_الامتحان', 'نوع الامتحان'],
  },
  {
    key: 'passed',
    label: 'النتيجة',
    type: 'منطقي: true/false أو ناجح/راسب أو 1/0',
    required: true,
    example: 'true',
    aliases: ['passed', 'النتيجة', 'result'],
  },
  {
    key: 'score',
    label: 'العلامة',
    type: 'رقم (0–100) — اختياري',
    required: false,
    example: '85',
    aliases: ['score', 'العلامة', 'mark'],
  },
  {
    key: 'notes',
    label: 'ملاحظات',
    type: 'نص — اختياري',
    required: false,
    example: '—',
    aliases: ['notes', 'ملاحظات'],
  },
]

const normalizeHeader = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

const aliasToKey = TRAFFIC_RESULTS_IMPORT_COLUMNS.reduce((map, col) => {
  col.aliases.forEach((alias) => {
    map.set(normalizeHeader(alias), col.key)
  })
  return map
}, new Map())

export const mapImportRow = (rawRow) => {
  const mapped = {}
  for (const [header, value] of Object.entries(rawRow)) {
    const key = aliasToKey.get(normalizeHeader(header))
    if (key && value !== undefined && value !== null && String(value).trim() !== '') {
      mapped[key] = value
    }
  }
  return mapped
}

const TRUTHY = new Set(['true', '1', 'yes', 'y', 'ناجح', 'نعم', 'نجح'])
const FALSY = new Set(['false', '0', 'no', 'n', 'راسب', 'لا', 'فشل'])

export const normalizePassed = (value) => {
  const v = String(value).trim().toLowerCase()
  if (TRUTHY.has(v)) return true
  if (FALSY.has(v)) return false
  return null
}

export const normalizeExamType = (value) => {
  const v = String(value).trim().toLowerCase()
  if (['theory', 'نظري', 'نظريّ'].includes(v)) return 'theory'
  if (['practical', 'عملي'].includes(v)) return 'practical'
  return null
}

export const validateImportRow = (row, rowNumber) => {
  const errors = []
  if (!row.studentEmail) errors.push(`الصف ${rowNumber}: البريد الإلكتروني مطلوب`)
  if (!row.categoryCode) errors.push(`الصف ${rowNumber}: فئة الرخصة مطلوبة`)
  if (!row.examType || !normalizeExamType(row.examType)) {
    errors.push(`الصف ${rowNumber}: نوع الامتحان غير صالح`)
  }
  if (row.passed === undefined || normalizePassed(row.passed) === null) {
    errors.push(`الصف ${rowNumber}: النتيجة غير صالحة`)
  }
  if (row.score !== undefined && row.score !== '' && Number.isNaN(Number(row.score))) {
    errors.push(`الصف ${rowNumber}: العلامة يجب أن تكون رقماً`)
  }
  return errors
}

export const toApiPayload = (row) => ({
  studentEmail: String(row.studentEmail).trim().toLowerCase(),
  categoryCode: String(row.categoryCode).trim().toUpperCase(),
  examType: normalizeExamType(row.examType),
  passed: normalizePassed(row.passed),
  ...(row.score !== undefined && row.score !== '' ? { score: Number(row.score) } : {}),
  ...(row.notes ? { notes: String(row.notes).trim() } : {}),
})
