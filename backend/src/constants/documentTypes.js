const DOCUMENT_TYPES = {
    NATIONAL_ID: 'national_id',
    DRIVING_LICENSE: 'driving_license',
    MEDICAL_REPORT: 'medical_report',
    OTHER: 'other',
};

const DOCUMENT_TYPE_LIST = Object.values(DOCUMENT_TYPES);

module.exports = { DOCUMENT_TYPES, DOCUMENT_TYPE_LIST };
