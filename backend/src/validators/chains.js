const { body, param, query } = require('express-validator');
const msg = require('./messages');
const { SYRIAN_GOVERNORATES } = require('../constants/syrianGovernorates');

const PASSWORD_REGEX = {
    upper: /[A-Z]/,
    lower: /[a-z]/,
    digit: /\d/,
    special: /[!@#$%^&*(),.?":{}|<>]/,
};

const LICENSE_CODE_REGEX = /^[A-Z](?:\d)?(?:\d)?$|^[A-Z]\d$/;
const LICENSE_SUB_CODE_REGEX = /^[A-Z]\d$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

const requiredString = (field, label, { min = 1, max = 500 } = {}) =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(msg.required(label))
        .isLength({ min, max })
        .withMessage(min > 1 ? msg.tooShort(label, min) : msg.tooLong(label, max));

const optionalString = (field, label, { max = 500 } = {}) =>
    body(field)
        .optional({ values: 'null' })
        .trim()
        .isLength({ max })
        .withMessage(msg.tooLong(label, max));

const requiredEmail = (field = 'email') =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(msg.required('البريد الإلكتروني'))
        .isEmail()
        .withMessage(msg.mustBeEmail)
        .normalizeEmail();

const optionalEmail = (field = 'email') =>
    body(field)
        .optional({ values: 'null' })
        .trim()
        .isEmail()
        .withMessage(msg.mustBeEmail)
        .normalizeEmail();

const requiredPassword = (field = 'password') =>
    body(field)
        .notEmpty()
        .withMessage(msg.required('كلمة المرور'))
        .isLength({ min: 8, max: 128 })
        .withMessage(msg.passwordWeak)
        .custom((value) => {
            if (!PASSWORD_REGEX.upper.test(value)) throw new Error(msg.passwordWeak);
            if (!PASSWORD_REGEX.lower.test(value)) throw new Error(msg.passwordWeak);
            if (!PASSWORD_REGEX.digit.test(value)) throw new Error(msg.passwordWeak);
            if (!PASSWORD_REGEX.special.test(value)) throw new Error(msg.passwordWeak);
            return true;
        });

const requiredPhone = (field = 'phone') =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(msg.required('رقم الهاتف'))
        .matches(PHONE_REGEX)
        .withMessage(msg.mustBePhone);

const optionalPhone = (field = 'phone') =>
    body(field)
        .optional({ values: 'null' })
        .trim()
        .matches(PHONE_REGEX)
        .withMessage(msg.mustBePhone);

const mongoIdBody = (field, label) =>
    body(field)
        .notEmpty()
        .withMessage(msg.required(label))
        .isMongoId()
        .withMessage(msg.mustBeMongoId(label));

const optionalMongoIdBody = (field, label) =>
    body(field)
        .optional({ values: 'null' })
        .isMongoId()
        .withMessage(msg.mustBeMongoId(label));

const mongoIdParam = (name, label) =>
    param(name).isMongoId().withMessage(msg.mustBeMongoId(label || name));

const optionalMongoIdParam = (name, label) =>
    param(name)
        .optional({ values: 'null' })
        .isMongoId()
        .withMessage(msg.mustBeMongoId(label || name));

const requiredLat = (field = 'lat') =>
    body(field)
        .notEmpty()
        .withMessage(msg.required('خط العرض'))
        .isFloat({ min: -90, max: 90 })
        .withMessage(msg.latInvalid);

const requiredLng = (field = 'lng') =>
    body(field)
        .notEmpty()
        .withMessage(msg.required('خط الطول'))
        .isFloat({ min: -180, max: 180 })
        .withMessage(msg.lngInvalid);

const queryLat = () =>
    query('lat')
        .notEmpty()
        .withMessage(msg.required('خط العرض (lat)'))
        .isFloat({ min: -90, max: 90 })
        .withMessage(msg.latInvalid);

const queryLng = () =>
    query('lng')
        .notEmpty()
        .withMessage(msg.required('خط الطول (lng)'))
        .isFloat({ min: -180, max: 180 })
        .withMessage(msg.lngInvalid);

const requiredLicenseCode = (field = 'categoryCode') =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(msg.required('فئة الرخصة'))
        .isLength({ min: 1, max: 3 })
        .withMessage(msg.licenseCodeInvalid)
        .custom((value) => {
            const code = String(value).toUpperCase();
            if (!/^[A-Z](?:\d{1,2})?$/.test(code)) throw new Error(msg.licenseCodeInvalid);
            return true;
        });

const optionalLicenseSubCode = (field = 'subTypeCode') =>
    body(field)
        .optional({ values: 'null' })
        .trim()
        .custom((value) => {
            if (!value) return true;
            if (!LICENSE_SUB_CODE_REGEX.test(String(value).toUpperCase())) {
                throw new Error('النوع الفرعي غير صالح (مثال: B1, B2)');
            }
            return true;
        });

const requiredBoolean = (field, label) =>
    body(field)
        .notEmpty()
        .withMessage(msg.required(label))
        .isBoolean()
        .withMessage(msg.mustBeBoolean(label));

const optionalBoolean = (field, label) =>
    body(field)
        .optional({ values: 'null' })
        .isBoolean()
        .withMessage(msg.mustBeBoolean(label));

const optionalBooleanQuery = (field, label) =>
    query(field)
        .optional()
        .isIn(['true', 'false', '1', '0'])
        .withMessage(msg.mustBeBoolean(label));

const requiredInt = (field, label, { min, max } = {}) => {
    let chain = body(field)
        .notEmpty()
        .withMessage(msg.required(label))
        .isInt(min != null ? { min, max } : {})
        .withMessage(msg.mustBeInt(label, min, max));
    if (min != null || max != null) chain = chain.toInt();
    return chain;
};

const optionalInt = (field, label, { min, max } = {}) => {
    let chain = body(field)
        .optional({ values: 'null' })
        .isInt(min != null ? { min, max } : {})
        .withMessage(msg.mustBeInt(label, min, max));
    if (min != null || max != null) chain = chain.toInt();
    return chain;
};

const requiredDate = (field, label) =>
    body(field)
        .notEmpty()
        .withMessage(msg.required(label))
        .isISO8601()
        .withMessage(msg.mustBeDate(label))
        .toDate();

const optionalDate = (field, label) =>
    body(field)
        .optional({ values: 'null' })
        .isISO8601()
        .withMessage(msg.mustBeDate(label))
        .toDate();

const requiredEnumBody = (field, label, values) =>
    body(field)
        .notEmpty()
        .withMessage(msg.required(label))
        .isIn(values)
        .withMessage(msg.mustBeIn(label, values));

const optionalEnumBody = (field, label, values) =>
    body(field)
        .optional({ values: 'null' })
        .isIn(values)
        .withMessage(msg.mustBeIn(label, values));

const optionalMediaRef = (field, label) =>
    body(field)
        .optional({ values: 'null' })
        .trim()
        .custom((value) => {
            if (!value) return true;
            if (/^https?:\/\//i.test(value)) {
                throw new Error('يجب رفع ملف صورة وليس إدخال رابط خارجي');
            }
            if (/^\/api\/v1\/media\/[a-f0-9]{24}$/i.test(value)) return true;
            if (/^[a-f0-9]{24}$/i.test(value)) return true;
            throw new Error(`${label} غير صالح — ارفع ملف صورة أولاً`);
        });

const stringArrayBody = (field, label, { min = 0, max = 50 } = {}) =>
    body(field)
        .optional({ values: 'null' })
        .isArray({ min, max })
        .withMessage(min ? msg.arrayMin(label, min) : msg.mustBeArray(label))
        .custom((arr) => arr.every((item) => typeof item === 'string'))
        .withMessage(`${label} يجب أن يحتوي على نصوص فقط`);

const paginationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage(msg.mustBeInt('رقم الصفحة', 1))
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('عدد النتائج يجب أن يكون بين 1 و 100')
        .toInt(),
    query('sort').optional().isString().trim().withMessage('ترتيب غير صالح'),
];

const requiredGovernorate = (field = 'governorate') =>
    body(field)
        .trim()
        .notEmpty()
        .withMessage(msg.required('المحافظة'))
        .isIn(SYRIAN_GOVERNORATES)
        .withMessage('المحافظة غير صالحة');

const optionalGovernorate = (field = 'governorate') =>
    body(field)
        .optional({ values: 'falsy' })
        .trim()
        .isIn(SYRIAN_GOVERNORATES)
        .withMessage('المحافظة غير صالحة');

module.exports = {
    PASSWORD_REGEX,
    requiredGovernorate,
    optionalGovernorate,
    requiredString,
    optionalString,
    requiredEmail,
    optionalEmail,
    requiredPassword,
    requiredPhone,
    optionalPhone,
    mongoIdBody,
    optionalMongoIdBody,
    mongoIdParam,
    optionalMongoIdParam,
    requiredLat,
    requiredLng,
    queryLat,
    queryLng,
    requiredLicenseCode,
    optionalLicenseSubCode,
    requiredBoolean,
    optionalBoolean,
    optionalBooleanQuery,
    requiredInt,
    optionalInt,
    requiredDate,
    optionalDate,
    requiredEnumBody,
    optionalEnumBody,
    optionalMediaRef,
    stringArrayBody,
    paginationQuery,
};
