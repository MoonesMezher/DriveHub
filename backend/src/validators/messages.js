/**
 * رسائل التحقق الموحّدة — عربية واضحة للمستخدم
 */
module.exports = {
    required: (label) => `${label} مطلوب`,
    invalid: (label) => `${label} غير صالح`,
    tooShort: (label, min) => `${label} يجب أن يكون ${min} أحرف على الأقل`,
    tooLong: (label, max) => `${label} يجب ألا يتجاوز ${max} حرفاً`,
    mustBeEmail: 'أدخل بريداً إلكترونياً صالحاً',
    mustBePhone: 'رقم الهاتف غير صالح (8–15 رقم)',
    mustBeMongoId: (label) => `معرّف ${label} غير صالح`,
    mustBeIn: (label, values) => `${label} يجب أن يكون أحد القيم: ${values.join('، ')}`,
    mustBeNumber: (label) => `${label} يجب أن يكون رقماً`,
    mustBeInt: (label, min, max) => {
        if (min != null && max != null) return `${label} يجب أن يكون عدداً صحيحاً بين ${min} و${max}`;
        if (min != null) return `${label} يجب أن يكون عدداً صحيحاً لا يقل عن ${min}`;
        return `${label} يجب أن يكون عدداً صحيحاً`;
    },
    mustBeBoolean: (label) => `${label} يجب أن يكون true أو false`,
    mustBeDate: (label) => `${label} يجب أن يكون تاريخاً صالحاً`,
    mustBeArray: (label) => `${label} يجب أن يكون مصفوفة`,
    arrayMin: (label, min) => `${label} يجب أن يحتوي على ${min} عنصر على الأقل`,
    arrayMax: (label, max) => `${label} يجب ألا يتجاوز ${max} عنصراً`,
    passwordWeak: 'كلمة المرور ضعيفة: 8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز خاص',
    nameNoDigits: (label) => `${label} لا يجوز أن يحتوي على أرقام`,
    digitsOnly: (label) => `${label} يجب أن يكون أرقاماً فقط`,
    latInvalid: 'خط العرض يجب أن يكون بين -90 و 90',
    lngInvalid: 'خط الطول يجب أن يكون بين -180 و 180',
    licenseCodeInvalid: 'رمز الرخصة غير صالح (مثال: B, B1, C, A)',
    validationFailed: 'بيانات غير صالحة — راجع الحقول أدناه',
};
