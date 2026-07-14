const { DOCUMENT_TYPES } = require('./documentTypes');

/** مستندات إلزامية قبل تقديم طلب الاشتراك */
const REQUIRED_ENROLLMENT_DOCUMENT_TYPES = [
    DOCUMENT_TYPES.NATIONAL_ID,
    DOCUMENT_TYPES.MEDICAL_REPORT,
];

module.exports = { REQUIRED_ENROLLMENT_DOCUMENT_TYPES };
