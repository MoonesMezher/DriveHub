/**
 * حدود سوريا الجغرافية — تشمل الشمال (حلب، إدلب، الرقة، الحسكة)
 * والشرق (دير الزور، تدمر) ولواء إسكندرونة غرباً.
 * المصدر: الحدود الإدارية السورية تقريباً (32.3°–37.4°N، 35.6°–42.4°E)
 */
export const SYRIA_BOUNDS = [
    [31.28, 36.58],
    [17.38, 44.42],
]

/** هامش للتمرير دون الخروج بعيداً عن سوريا */
export const SYRIA_MAX_BOUNDS = [
    [31.9, 35.1],
    [37.7, 42.8],
]

export const SYRIA_CENTER = [34.8, 38.8]

/** أدنى/أقصى تكبير لضمان رؤية البلاد كاملة عند التحميل */
export const SYRIA_MIN_ZOOM = 5
export const SYRIA_MAX_ZOOM = 14
export const SYRIA_DEFAULT_ZOOM = 6

/** نقطة افتراضية (دمشق) عند تعذّر تحديد موقع المستخدم */
export const DEFAULT_USER_COORDS = { lat: 33.5138, lng: 36.2765 }